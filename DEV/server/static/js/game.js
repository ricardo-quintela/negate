// initializing player data object
var playerData = {};
var socket = null;

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

document.addEventListener("DOMContentLoaded", () => {

    var mainEl = document.querySelector("main");

    // connect to the socket
    socket = io();

    // join the room
    socket.emit("join", { roomId: roomId, username: username });
    

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


});

// disconnect from the room once the window closes
window.addEventListener("unload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
