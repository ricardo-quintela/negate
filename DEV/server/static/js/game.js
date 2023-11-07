// initializing player data object
var playerData = {};
var username = null;
var roomId = null;
var socket = null;


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
        console.log(playerData);
    });


});

// disconnect from the room once the window closes
window.addEventListener("beforeunload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});