/**
 * How fast the game updates -> 60fps is 16.67
 */
const TICK_SPEED = 16.67;
var socket = null;
var isSharedSpace = false;
var loadedResources = false;

// map and players related
const CURRENT_MAP = "map_2";
var mapInfo = null;
var players = null;
var characterAnimations = null;
var mapInteractables = null;

// client related -> inventories
var documentInventory = [];
var itemInventory = [];
var selectedItem = 0;
var targetInteractable = null;
var targetInteractableId = -1;
var tradeItem = -1;
var receivedItems = 0;

// main element of the code
var mainEL = null;

/**
 * the PIXI app
 */
var app = null;
var controller = null;

/**
 * The current selected character of the player
 */
var selectedCharacter = -1;

/**
 * Weather the player has selected and locked in a character
 */
var isLockedIn = false;

/**
 * An object containing the data of each player
 * 
 * Updated on 'playerData' event
 */
var playerData = {};

// getting username and roomId from the request
const username = new URLSearchParams(window.location.search).get("username");
const roomId = window.location.pathname.slice(6);
const domain = window.location.hostname;

/**
 * the state of the game
 */
var gamePhase = "lobby";

/**
 * Annotates the character indexes
 */
const characters = {
    tech: 0,
    journalist: 1,
    detective: 2,
    mechanic: 3
}

//character image filename (in static/img folder)
const characterImgs = ["tech.png", "journalist.png", "detective.png", "mechanic.png"]

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
/**
 * Emits a ready event with the current ready state
 */
function setReady() {
    socket.emit("ready", { roomId: roomId, isReady: !playerData[socket.id].isReady });
}

function insertItem(targetItem){
    itemInventory.push(targetItem);
    
    const inventorySlotsEl = Array.from(document.querySelectorAll(".side-by-side-inventory > .grid > .grid-item"));
    
    inventorySlotsEl[itemInventory.length - 1].style.backgroundImage = `url(${targetItem.img})`;
    tradeItem = -1;
}

function selectItem(item){

    tradeItem = item;
    const itemDescriptionEl = document.querySelector(".item-description");
    const itemTitleEl = itemDescriptionEl.querySelector(".item-desc-title");
    const itemTextEl = itemDescriptionEl.querySelector(".item-desc-text");

    itemTitleEl.innerHTML = itemInventory[item].name;
    itemTextEl.innerHTML = itemInventory[item].content;

}

function selectDocument(doc){

    const docDescriptionEl = document.querySelector(".document-description");
    const docTitleEl = docDescriptionEl.querySelector(".document-desc-title");
    const docTextEl = docDescriptionEl.querySelector(".document-desc-text");

    docTitleEl.innerHTML = documentInventory[doc].name;
    docTextEl.innerHTML = documentInventory[doc].content;

}

function selectPlayerTrade(player){

    let payload = {roomId: roomId, item: itemInventory[tradeItem], receiverId: player};
    socket.emit("send_item", payload);

}

function openTradeMenu() {
    let characterEls = Array.from(document.getElementsByClassName("character"));
    let j = 0;
    let players = Object.keys(playerData);
    for (let i = 1; i < players.length; i++) {
        const player = players[i];
        if (player === socket.id) {
            continue;
        }
        let el = characterEls[j];
        el.getElementsByClassName("character-image")[0].style.backgroundImage = `url(../img/${characterImgs[playerData[player]["character"]]})`;
        el.getElementsByClassName("name-info")[0].innerHTML = playerData[player]["username"];

        el.getElementsByClassName("character-image")[0].addEventListener("click", () => {
            selectPlayerTrade(player);
            closeTradeMenu();
        });
        j++;
    }
    

    const item = itemInventory[tradeItem];
    document.getElementsByClassName("submenu-title")[0].innerHTML = `Choose who to send ${item.name} to.`;
    document.getElementsByClassName("side-by-side-inventory")[0].classList.add("hidden");
    let tradeMenuEl = document.getElementById("tradeMenu");
    document.getElementById("goBackArrow").classList.remove("hidden");
    tradeMenuEl.classList.remove("hidden");
}

function closeTradeMenu() {
    let tradeMenuEl = document.getElementById("tradeMenu");
    document.getElementById("goBackArrow").classList.add("hidden");
    tradeMenuEl.classList.add("hidden");
    document.getElementsByClassName("submenu-title")[0].innerHTML = "Inventory";
    document.getElementsByClassName("side-by-side-inventory")[0].classList.remove("hidden");
    const itemDescriptionEl = document.querySelector(".item-description");
    const itemTitleEl = itemDescriptionEl.querySelector(".item-desc-title");
    const itemTextEl = itemDescriptionEl.querySelector(".item-desc-text");

    itemTitleEl.innerHTML = "";
    itemTextEl.innerHTML = "";

}

/**
 * Sets the character number to the index of the clicked element
 * @param {Element} element the character that was clicked
 */
function selectCharacter(element) {
    // cannot re-select a characted when locked in
    if (isLockedIn) return;

    // cannot select a character that is unavailable
    const characterImageEl = element.closest(".character .character-image");
    if (characterImageEl.dataset.unavailable === "true") return;

    // get the character name
    const character = element.closest(".character").dataset.character;
    const characterImagesEl = Array.from(document.querySelectorAll(".character > .character-image"));

    // remove hightlight
    if (selectedCharacter === characters[character]) {
        characterImagesEl[characters[character]].classList.remove("highlighted");
        selectedCharacter = -1;
        return;
    }

    // add highlight
    characterImagesEl.forEach(charEl => charEl.classList.remove("highlighted"));
    characterImagesEl[characters[character]].classList.add("highlighted");

    // update selected character
    selectedCharacter = characters[character];
}

/**
 * Emits a lockIn event to the server to lock in the character for the player
 * @param {Element} element the button that was clicked
 * @returns if a character is not selected
 */
function lockInCharacter(element) {
    if (selectedCharacter === -1) return;

    socket.emit("lockIn", { roomId: roomId, character: selectedCharacter });


    isLockedIn = true;
    element.disabled = true;
}

/**
 * Fires an interact event whenever the player clicks on the button
 */
function interact() {
    if (targetInteractable === null) return;
    
    socket.emit("interact", { roomId: roomId, interactableId: targetInteractableId });
}


// setting window on load event to connect to the websocket
document.addEventListener("DOMContentLoaded", () => {
    mainEl = document.querySelector("main");

    // connect to the socket
    socket = io();

    // join the room
    socket.emit("join", { roomId: roomId, username: username });





    // player in game data
    socket.on("playerData", (payload) => {

        // update the player data to match the server payload
        playerData = payload;

        // update ready players list
        if (gamePhase === "lobby") {
            if (Object.keys(playerData)[0] === socket.id) {
                isSharedSpace = true;
            }

            // load the lobby menu
            mainEl.innerHTML = requestResource("lobby_menu", roomId, socket.id, isSharedSpace);

            const readyCountEl = document.querySelector("#readyCount");
            
            // contar quantos jogadores estão prontos
            var playersReady = 0;
            for (const player in playerData) {
                if (playerData[player].isReady) {
                    playersReady++;
                }
            }
            
            // update ready players display
            readyCountEl.innerHTML = `${playersReady}/4`;
            
            // ignore shared space screen
            if (!isSharedSpace) {
                // update button text based on the current player's ready state
                const readyStringEl = document.querySelector("#readyButton");
    
                if (playerData[socket.id] && playerData[socket.id].isReady) {
                    readyStringEl.innerHTML = 'Unready';
                } else {
                    readyStringEl.innerHTML = 'Ready';
                }
            }


        }

        // character selection phase
        if (gamePhase === "lobby" && playersReady === 4 && Object.keys(playerData).length === 5) {
            gamePhase = "characterSelection";

            mainEl.innerHTML = requestResource("character_selection", roomId, socket.id, isSharedSpace);

            if (!isSharedSpace) {
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

            // load the selected characters to the shared space interface to show who selected the character
            if (isSharedSpace) {
                const keys = Object.keys(playerData);
                let i = keys.indexOf(playerId) - 1;
                characterImagesEl[i].style.backgroundImage = `url(../img/${characterImgs[character]})`;
                let str = getKeyByValue(characters, character);
                str = str.charAt(0).toUpperCase() + str.slice(1);
                let characterNameEl = characterImagesEl[i].parentElement.getElementsByTagName("h2")[0];
                characterNameEl.innerHTML = str;
                characterNameEl.classList.remove("character-name-hidden");

            }
            // make the selected character grayed out for other players
            else if (playerId !== socket.id) {
                characterImagesEl[character].classList.add("greyed-out");
            }
            // make all the other characters grayed out
            else {
                for (var i = 0; i < 4; i++) {
                    if (i === character) continue;
                    characterImagesEl[i].classList.add("greyed-out");
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
                // load the map spritesheets
                const roomsSpriteSheet = await loadSprites("rooms", "/sprites/spritesheet_rooms.json");
                const objectsSpriteSheet = await loadSprites("objects", "/sprites/spritesheet_interiors.json");

                // load the map and save the colliders and interactables info
                mapInfo = await loadMap(app, CURRENT_MAP, roomsSpriteSheet, objectsSpriteSheet);
                
                // load the character spritesheets to animations
                characterAnimations = await loadCharacterSpritesheets([
                    "/sprites/characters/spritesheet_tech.json",
                    "/sprites/characters/spritesheet_journalist.json",
                    "/sprites/characters/spritesheet_detective.json",
                    "/sprites/characters/spritesheet_mechanic.json"
                ]);
                // load the player models and animations
                players = await loadPlayers(app, playerData, socket.id, characterAnimations);

                // update positions
                setInterval(updatePlayers, TICK_SPEED, socket.id, mapInfo.colliders, characterAnimations);
                setInterval(calcultateInteractions, TICK_SPEED, socket.id, mapInfo.interactables); // TODO: set TICK_SPEED as interval
            }

            // set the state to be ready to play
            loadedResources = true;

        }
    });



    /**
     * Activates and deactivates the "interact" button
     */
    socket.on("itemData", (payload) => {
        // ignore if the item doesn't belong to the player
        if (!(socket.id in payload)) return;

        // define state of player as interacting
        playerData[socket.id].isInteracting = payload[socket.id].isInteracting;

        // load the interactable from the payload
        targetInteractable = payload[socket.id].target;
        targetInteractableId = payload[socket.id].interactableId;

        // activate the interact button
        const interactButton = document.querySelector(".interact-button");
        interactButton.disabled = !payload[socket.id].isInteracting;
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


    socket.on("playerSend",(payload) => {

        if(socket.id !== payload.receiverId && socket.id !== payload.senderId) return;        
        const targetItem = payload.item;

        if(socket.id === payload.receiverId){
        
        insertItem(targetItem);
        receivedItems++;
        notificationBadgeEl = document.getElementsByClassName("badge")[0];
        notificationBadgeEl.innerHTML = `${receivedItems}`;
        notificationBadgeEl.classList.remove("hidden");

        }
        if(socket.id === payload.senderId){

            
            itemInventory.pop(targetItem);
            const inventorySlotsEl = Array.from(document.querySelectorAll(".side-by-side-inventory > .grid > .grid-item"));
            inventorySlotsEl[tradeItem].style.backgroundImage = null;
            const itemDescriptionEl = document.querySelector(".item-description");
            const itemTitleEl = itemDescriptionEl.querySelector(".item-desc-title");
            itemTitleEl.innerHTML = "";
            const itemTextEl = itemDescriptionEl.querySelector(".item-desc-text");
            itemTextEl.innerHTML = "";


        }

       
    });


});

// disconnect from the room once the window closes
window.addEventListener("unload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
