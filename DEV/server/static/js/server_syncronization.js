var socket = null;
var isSharedSpace = false;
var loaded_resources = false;

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


/**
 * Emits a ready event with the current ready state
 */
function setReady() {
    socket.emit("ready", { roomId: roomId, isReady: !playerData[socket.id].isReady });
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






document.addEventListener("DOMContentLoaded", () => {

    var mainEl = document.querySelector("main");

    // connect to the socket
    socket = io();

    // join the room
    socket.emit("join", { roomId: roomId, username: username });
    
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
            console.log(mainEl)
            console.log(mainEl.innerHTML)
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

            if (isSharedSpace === true) {
                let readyNamesEl = document.getElementsByClassName("readyNames");
                readyNamesEl = readyNamesEl[0];
                let children = readyNamesEl.getElementsByTagName('div');

                // if we're adding a row
                if (playersReady > children.length) {
                    for (const player in playerData) {
                        if (!playerData[player].isReady) {
                            continue;
                        }
                        let present = false;
                        for (let i = 0; i < children.length; i++) {
                            if (children[i].innerHTML === playerData[player].username) {
                                present = true;
                                break;
                            }
                        }
                        if (!present) {
                            let newDiv = document.createElement("div");
                            newDiv.appendChild(document.createTextNode(playerData[player].username));
                            readyNamesEl.appendChild(newDiv);
                        }
                    }
                }
                //removing
                else if (playersReady < children.length) {
                    let removed = false;
                    for (let i = 0; i < children.length && !removed; i++) {
                        let players = Object.values(playerData);
                        for (let p in players) {
                            let player = players[p]
                            if (player.username === children[i].innerHTML && !player.isReady) {
                                children[i].parentNode.removeChild(children[i]);
                                removed = true;
                            }
                        }
                    }
                }
            }
        }

        // colocar na fase de seleção de personagens
        if (gamePhase === "lobby" && playersReady === 4 && Object.keys(playerData).length === 5) {
            gamePhase = "characterSelection";

            mainEl.innerHTML = requestResource("character_selection", roomId, socket.id, isSharedSpace);
        }

        // on player movement or interactions
        if (gamePhase === "playing" && loaded_resources) {
            console.log(payload);
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
        }

        // change game state
        if (gamePhase === "characterSelection" && playersLockedIn === 4) {
            gamePhase = "playing";

            // load the app
            app = initializeApp(mainEl);

            // load the controller for the cell phone users
            if (!isSharedSpace) {
                controller = loadController(app);
            } else {
                const roomsSpriteSheet = await loadSprites("rooms", "/sprites/spritesheet_rooms.json");
                const objectsSpriteSheet = await loadSprites("objects", "/sprites/spritesheet_interiors.json");

                loadMap(app, "map1", "/maps/map_1.json", roomsSpriteSheet, objectsSpriteSheet);
            }

            // set the state to be ready to play
            loaded_resources = true;
        }
    });

});

// disconnect from the room once the window closes
window.addEventListener("unload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
