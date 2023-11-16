// player in game data
socket.on("playerData", (payload) => {
    playerData = payload;

    // atualizar lista de jogadores prontos
    if (gamePhase === "lobby") {
        if (Object.keys(playerData)[0] === socket.id) {
            isSharedSpace = true;
        }

        // load the lobby menu
        mainEl.innerHTML = requestResource("lobby_menu", roomId, socket.id, isSharedSpace);

        const readyCountEl = document.querySelector("#readyCount");
        var playersReady = 0;

        // contar quantos jogadores estão prontos
        for (const player in playerData) {
            if (playerData[player].isReady === true) {
                playersReady++;
            }
        }

        // atualizar display
        readyCountEl.innerHTML = `${playersReady}/4`;
    }

    // colocar na fase de seleção de personagens
    if (gamePhase === "lobby" && playersReady === 4 && Object.keys(playerData).length === 5) {
        gamePhase = "characterSelection";

        mainEl.innerHTML = requestResource("character_selection", roomId, socket.id, isSharedSpace);

        if (isSharedSpace === false) {
            const characterImagesEl = Array.from(document.querySelectorAll(".character > .character-image"));
            for (let i = 0; i < characterImgs.length; i++) {
                characterImagesEl[i].style.backgroundImage = `url(../img/${characterImgs[i]})`;
                characterImagesEl[i].style.backgroundRepeat = "no-repeat";
                characterImagesEl[i].style.backgroundSize = "cover";
            }
        }
        else {
            const charactersEl = Array.from(document.querySelectorAll(".characters > .character > .name-info > h2"));
            let keys = Object.keys(playerData);
            for (let i = 1; i < keys.length; i++) {
                charactersEl[i - 1].innerHTML = playerData[keys[i]].username;
            }
        }
    }

    // on player interactions
    if (gamePhase === "playing" && loadedResources) {
        
        //TODO: REMOVE THIS IF NOT NEEDED

    }
});





// when a player selects a character
socket.on("characterData", async (payload) => {

    var playersLockedIn = 0;
    const characterImagesEl = Array.from(document.querySelectorAll(".character > .character-image"));
    for (var playerId of Object.keys(payload)) {
        const character = payload[playerId]["character"];

        // character wasn't selected -> an error possibly
        if (character === -1) continue;

        characterImagesEl[character].dataset.unavailable = "true";
        playerData[playerId]["character"] = character;

        playersLockedIn += 1;

        // in cases someone locks in the character at the same time as other is selecting it
        if (playerId !== socket.id && selectedCharacter === character) {
            characterImagesEl[character].classList.remove("highlighted");
            selectedCharacter = -1;
        }

        if (isSharedSpace === true) {
            const keys = Object.keys(playerData);
            let i = keys.indexOf(playerId) - 1;
            characterImagesEl[i].style.backgroundImage = `url(../img/${characterImgs[character]})`;
            let str = getKeyByValue(characters, character);
            str = str.charAt(0).toUpperCase() + str.slice(1);
            let characterNameEl = characterImagesEl[i].parentElement.getElementsByTagName("h2")[0];
            characterNameEl.innerHTML = str;
            characterNameEl.classList.remove("character-name-hidden");

        }

        else {
            if (playerId !== socket.id) {
                characterImagesEl[character].classList.add("greyed-out");
            }
        }
    }

    // change game state
    if (gamePhase === "characterSelection" && playersLockedIn === 4) {
        gamePhase = "playing";

        // load the app
        app = initializeApp(mainEl, roomId, playerId, isSharedSpace);

        // load the controller for the cell phone users
        if (!isSharedSpace) {
            controller = loadController(app);
        } else {
            const roomsSpriteSheet = await loadSprites("rooms", "/sprites/spritesheet_rooms.json");
            const objectsSpriteSheet = await loadSprites("objects", "/sprites/spritesheet_interiors.json");
            mapInfo = await loadMap(app, "map_1", roomsSpriteSheet, objectsSpriteSheet);
            
            characterAnimations = await loadCharacterSpritesheets([
                "/sprites/characters/spritesheet_tech.json",
                "/sprites/characters/spritesheet_journalist.json",
                "/sprites/characters/spritesheet_detective.json",
                "/sprites/characters/spritesheet_mechanic.json"
            ]);
            players = await loadPlayers(app, playerData, socket.id, characterAnimations);

            // update positions
            setInterval(updatePlayers, TICK_SPEED, socket.id, mapInfo.colliders, characterAnimations);
            setInterval(calcultateInteractions, TICK_SPEED, socket.id, mapInfo.interactables);
        }

        // set the state to be ready to play
        loadedResources = true;

    }
});



// handle item data event
socket.on("itemData", (payload) => {
    if (socket.id in payload) {
        playerData[socket.id].isInteracting = payload[socket.id].isInteracting;
        targetInteractable = payload[socket.id].target;
        targetInteractableId = payload[socket.id].interactableId;

        const interactButton = document.querySelector(".interact-button");
        interactButton.disabled = !payload[socket.id].isInteracting;
    }
});





// handle player interaction data event
socket.on("playerInteraction", (payload) => {

    // deactivate interactable
    if (isSharedSpace) {
        mapInfo.interactables[payload.interactableId].active = false;
        return;
    }

    // ignore if not the correct player
    if (socket.id !== payload.playerId) return;


    if(targetInteractable.type === "item"){
        // add the item to the inventory
        itemInventory.push(targetInteractable);
    
        // get the inventory slot elements
        const inventorySlotsEl = Array.from(document.querySelectorAll(".side-by-side-inventory > .grid > .grid-item"));
        const itemDescriptionEl = document.querySelector(".item-description");
        const itemTitleEl = itemDescriptionEl.querySelector(".item-desc-title");
        const itemTextEl = itemDescriptionEl.querySelector(".item-desc-text");

        // set the item slot properties
        inventorySlotsEl[itemInventory.length - 1].style.backgroundImage = `url(${targetInteractable.img})`;
        itemTitleEl.innerHTML = targetInteractable.name;
        itemTextEl.innerHTML = targetInteractable.content;
    }
    else if(targetInteractable.type === "document"){
        documentInventory.push(targetInteractable);

        // get the document slot elements
        const documentSlotsEl = Array.from(document.querySelectorAll(".document-content > .document-list > .document-item"));
        const documentDescriptionEl = document.querySelector(".document-description");
        const documentTitleEl = documentDescriptionEl.querySelector(".document-desc-title");
        const documentTextEl = documentDescriptionEl.querySelector(".document-desc-text");

        // set the document
        documentSlotsEl[documentInventory.length - 1].innerHTML = targetInteractable.name;
        documentTitleEl.innerHTML = targetInteractable.name;
        documentTextEl.innerHTML = targetInteractable.content;
    }
    
    // reseting target interactable
    targetInteractable = null;
    targetInteractableId = -1;

    // setting selected item on the inventory to the last added
    selectedItem = itemInventory.length - 1;
});