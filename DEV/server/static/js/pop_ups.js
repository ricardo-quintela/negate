
/**
 * Sets the closest element with a class of "pop-up" to hidden
 * @param {Element} element the element that was clicked
 */
function closePopUp(element) {
    const popUpEl = element.closest(".pop-up");
    popUpEl.classList.add("hidden");
}


/**
 * Shows the corresponding character pop up
 * @param {Element} element the element that was clicked
 */
function characterInfo(element) {
    const character = element.closest(".character").dataset.character;
    const characterIntroductionEl = Array.from(document.querySelectorAll(".character-info"));
    characterIntroductionEl[characters[character]].classList.remove("hidden");
}


/**
 * Opens the inventory pop-up and closes the documents menu
 */
function openInventory() {
    const inventoryEl = document.querySelector(".inventory");
    inventoryEl.classList.remove("hidden");
    const documentInventoryEl = document.querySelector(".document");
    documentInventoryEl.classList.add("hidden");
}

/**
 * Closes the inventory pop up
 */
function closeInventory() {
    let goBackEl = document.querySelector("#goBackArrow");
    if (!goBackEl.classList.contains("hidden")) goBackEl.classList.add("hidden");

    let tradeMenuEl = document.querySelector("#tradeMenu");
    if (!tradeMenuEl.classList.contains("hidden")) tradeMenuEl.classList.add("hidden");

    let sideBySideEl = document.querySelector(".side-by-side-inventory");
    if (sideBySideEl.classList.contains("hidden")) sideBySideEl.classList.remove("hidden");

    document.querySelector(".submenu-title").innerHTML = "Inventory";

    let inventoryEl = document.querySelector(".inventory");
    inventoryEl.classList.add("hidden");
}

/**
 * Opens document inventory and closes item inventory
 */
function openDocuments() {
    const documentInventoryEl = document.querySelector(".document");
    documentInventoryEl.classList.remove("hidden");

    const inventoryEl = document.querySelector(".inventory");
    inventoryEl.classList.add("hidden");
}


/**
 * Closes the documents pop up menu
 */
function closeDocuments() {
    let document1 = document.querySelector(".document");
    document1.classList.add("hidden");
}


/**
 * Opens the trade menu and hides the inventory menu
 */
function openTradeMenu() {
    let characterEls = Array.from(document.querySelector(".character"));
    let j = 0;
    let players = Object.keys(playerData);

    // adding the characters to the trade menu
    for (let i = 1; i < players.length; i++) {
        
        let player = players[i];
        if (player === socket.id) {
            continue;
        }
        let el = characterEls[j];

        // filling the element with image and text corresponding to the character
        el.querySelector(".character-image").style.backgroundImage = `url(../img/${characterImgs[playerData[player]["character"]]})`;
        el.querySelector(".name-info").innerHTML = playerData[player]["username"];
        j++;
    }

    const item = itemInventory[selectedItem];
    document.querySelector(".submenu-title").innerHTML = `Choose who to send ${item.name} to.`;
    document.querySelector(".side-by-side-inventory").classList.add("hidden");
    let tradeMenuEl = document.getElementById("tradeMenu");
    document.getElementById("goBackArrow").classList.remove("hidden");
    tradeMenuEl.classList.remove("hidden");
}


/**
 * Closes the trade menu and re-opens inventory
 */
function closeTradeMenu() {
    let tradeMenuEl = document.getElementById("tradeMenu");
    document.getElementById("goBackArrow").classList.add("hidden");
    tradeMenuEl.classList.add("hidden");
    document.querySelector(".submenu-title").innerHTML = "Inventory";
    document.querySelector(".side-by-side-inventory").classList.remove("hidden");
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