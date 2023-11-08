// initializing player data object
var playerData = {};
var username = null;
var roomId = null;
var socket = null;

var gamePhase = "lobby";


/**
 * Emits a ready event with the current ready state
 */
function setReady() {
    socket.emit("ready", { roomId: roomId, isReady: !playerData[socket.id].isReady });
}


document.addEventListener("DOMContentLoaded", () => {

    // getting roomId and username from request
    username = new URLSearchParams(window.location.search)
                        .get("username");
    roomId = window.location.pathname.slice(6);

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
    });


});

// disconnect from the room once the window closes
window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
