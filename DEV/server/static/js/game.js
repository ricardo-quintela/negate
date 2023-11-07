document.addEventListener("DOMContentLoaded", () => {

    const username = new URLSearchParams(window.location.search)
                        .get("username");

    const roomId = window.location.pathname.slice(6);

    // getting socket
    const socket = io.connect(window.location.hostname);

    socket.emit("join", { roomId: roomId, username: username });
    

    socket.on("playerData", (payload) => {

        console.log(payload);

    });

});