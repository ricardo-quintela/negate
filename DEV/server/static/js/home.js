document.addEventListener("DOMContentLoaded", () => {

    // getting the forms to join a room and creating room
    const createRoomForm = document.querySelector("#createRoomForm");
    const joinRoomForm = document.querySelector("#joinRoomForm");
    
    // necessary inputs for each query param
    const roomIdInput = joinRoomForm.querySelector("#roomIdInput");
    const usernameInput = document.querySelector("#usernameInput");

    // behaviour of the create room form
    createRoomForm.addEventListener("submit", (event) => {
        event.preventDefault();

        // getting the username (common input for both forms)
        username = usernameInput.value;
        
        if (username === "") {
            return;
        }
        
        window.location.replace(`/create-room?username=${username}`);
        
    });
    
    // behaviour of the join room form
    joinRoomForm.addEventListener("submit", (event) => {
        event.preventDefault();
        
        // getting the username (common input for both forms)
        username = usernameInput.value;
        if (username === "") {
            return;
        }

        roomId = roomIdInput.value;
        if (roomId === "") {
            return;
        }
        
        window.location.replace(`/join-room?roomId=${roomId}&username=${username}`);

    });

});