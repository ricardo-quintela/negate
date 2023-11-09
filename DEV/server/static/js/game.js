// initializing player data object
var playerData = {};
var socket = null;
var selectedCharacter = -1;
var isLockedIn = false;

// getting username and roomId from the request
const username = new URLSearchParams(window.location.search).get("username");
const roomId = window.location.pathname.slice(6);
const domain = window.location.hostname;

var gamePhase = "lobby";

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

            mainEl.innerHTML = requestResource("character_selection", roomId, socket.id);
        }
    });


    // when a player selects a character
    socket.on("characterData", (payload) => {

        const characterImagesEl = Array.from(document.querySelectorAll(".character > .character-image"));
        for (var playerId of Object.keys(payload)) {
            const character = payload[playerId]["character"];

            // character wasn't selected -> an error possibly
            if (character === -1) continue;

            characterImagesEl[character].dataset.unavailable = "true";

            // in cases someone locks in the character at the same time as other is selecting it
            if (selectedCharacter === character) {
                characterImagesEl[character].classList.remove("highlighted");
                selectedCharacter = -1;
            }
        }

        // change game state
        if (Object.keys(payload).length === 4) {
            gamePhase = "playing";
            console.log("GAME CAN START");
        }
    });


});

// disconnect from the room once the window closes
window.addEventListener("unload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
