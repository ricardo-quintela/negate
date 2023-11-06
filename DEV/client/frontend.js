// Conectar ao Socket.IO
const socket = io.connect("http://127.0.0.1:5000/");

// Funcao de criar sala (obter username do HTML)
function createRoom() {
    const username = document.getElementById("usernameInput").value;
    // Check if a username is provided
    if (username) {
        //Criar sala
        socket.emit("create-room", { username });
    } else {
        //Caso n exista username
        alert("Please enter a username.");
    }
}

// Funcao para juntar-se a uma sala (com pop-up)
function joinRoom() {
    const username = document.getElementById("usernameInput").value;
    // Check if a username is provided
    if (username) {
        const roomCode = prompt("Enter the room code:");
        if (roomCode) {
            //Enviar um "join-room" com username e roomCode
            socket.emit("join-room", { roomId: roomCode, username });
        } else {
            alert("Please enter a room code.");
        }
    } else {
        alert("Please enter a username.");
    }
}


// ir para a escolha de character (O SERVER TEM DE EMITIR ESTA FUNCAO)
socket.on("startCharacterSelection", () => {
    setupCharacterSelection();
});

function setupCharacterSelection() {
    const characterImages = document.querySelectorAll(".character-image");
    const readyButtons = document.querySelectorAll(".ready-button");

    characterImages.forEach((characterImage, characterNumber) => {
        const readyButton = readyButtons[characterNumber];

        characterImage.addEventListener("click", () => {
            characterImage.classList.add("selected");
            readyButton.style.display = "block";
            socket.emit("characterSelected", { character: characterNumber });
        });

        readyButton.addEventListener("click", () => {
            characterImage.classList.add("locked");
            readyButton.style.display = "none";
            socket.emit("characterReady", { character: characterNumber });
        });
    });
}


// Evento "startGame" do sv
socket.on("startGame", () => {
    // Ir para gameScreen
    console.log("Game has started!");
});
