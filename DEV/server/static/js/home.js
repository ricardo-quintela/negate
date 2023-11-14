document.addEventListener("DOMContentLoaded", () => {

    // getting the forms to join a room and creating room
    const createRoomFormEl = document.querySelector("#createRoomForm");
    const joinRoomFormEl = document.querySelector("#joinRoomForm");
    
    // necessary inputs for each query param
    const roomIdInputEl = joinRoomFormEl.querySelector("#roomIdInput");
    const usernameInputEl = document.querySelector("#usernameInput");

    // behaviour of the create room form
    createRoomFormEl.addEventListener("submit", (event) => {
        event.preventDefault();

        // getting the username (common input for both forms)
        username = usernameInputEl.value;
        
        if (username === "") {
            return;
        }
        
        window.location.replace(`/create-room?username=${username}`);
        
    });

    // behaviour of the join room form
    joinRoomFormEl.addEventListener("submit", (event) => {
        event.preventDefault();
        
        // getting the username (common input for both forms)
        username = usernameInputEl.value;
        if (username === "") {
            return;
        }

        roomId = roomIdInputEl.value;
        if (roomId === "") {
            return;
        }
        
        window.location.replace(`/join-room?roomId=${roomId}&username=${username}`);

    });

});

function closePopup() {
    let popup = document.getElementById("close-join-popup").parentElement;
    popup.classList.remove("join-popup-visible");
}

function openPopup() {
    const usernameInputEl = document.querySelector("#usernameInput");

    if (usernameInputEl.value === "") {
        return;
    }
    let popup = document.getElementById("join-popup");
    popup.classList.add("join-popup-visible");
}