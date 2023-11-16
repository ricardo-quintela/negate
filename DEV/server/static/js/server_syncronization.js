/**
 * How fast the game updates -> 60fps is 16.67
 */
const TICK_SPEED = 16.67;
var socket = null;
var isSharedSpace = false;
var loadedResources = false;

// map and players related
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

});

// disconnect from the room once the window closes
window.addEventListener("unload", (event) => {
    event.preventDefault();
    socket.emit("leave", { roomId: roomId });
});
