
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

    const itemDescriptionEl = document.querySelector(".item-description");
    const itemTitleEl = itemDescriptionEl.querySelector(".item-desc-title");
    const itemTextEl = itemDescriptionEl.querySelector(".item-desc-text");
    const tradeButton = document.getElementById("TradeButton");

    itemTitleEl.innerHTML = "";
    itemTextEl.innerHTML = "";
    tradeButton.disabled = true;

    let inventoryEl = document.getElementsByClassName("inventory")[0];
    inventoryEl.classList.remove("hidden");
}


function closeInventory() {
    let goBackEl = document.getElementById("goBackArrow");
    if (!goBackEl.classList.contains("hidden")) goBackEl.classList.add("hidden");

    let tradeMenuEl = document.getElementById("tradeMenu");
    if (!tradeMenuEl.classList.contains("hidden")) tradeMenuEl.classList.add("hidden");

    let sideBySideEl = document.getElementsByClassName("side-by-side-inventory")[0];
    if (sideBySideEl.classList.contains("hidden")) sideBySideEl.classList.remove("hidden");

    document.getElementsByClassName("submenu-title")[0].innerHTML = "Inventory";

    let inventoryEl = document.getElementsByClassName("inventory")[0];
    inventoryEl.classList.add("hidden");
}


/**
 * Opens document inventory and closes item inventory
 */
function openDocuments() {
    const docDescriptionEl = document.querySelector(".document-description");
    const docTitleEl = docDescriptionEl.querySelector(".document-desc-title");
    const docTextEl = docDescriptionEl.querySelector(".document-desc-text");

    docTitleEl.innerHTML = "";
    docTextEl.innerHTML = "";

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
    let characterEls = Array.from(document.querySelectorAll(".character"));
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
        el.getElementsByClassName("character-image")[0].style.backgroundImage = `url(../img/${characterImgs[playerData[player]["character"]]})`;
        el.getElementsByClassName("name-info")[0].innerHTML = playerData[player]["username"];
        el.getElementsByClassName("character-image")[0].onclick = function () {selectPlayerTrade(player);};
        j++;
    }

    const item = itemInventory[tradeItem];
    document.getElementsByClassName("submenu-title")[0].innerHTML = `Choose who to send ${item.name} to.`;
    document.getElementsByClassName("side-by-side-inventory")[0].classList.add("hidden");
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
    document.getElementsByClassName("submenu-title")[0].innerHTML = "Inventory";
    document.getElementsByClassName("side-by-side-inventory")[0].classList.remove("hidden");
    const itemDescriptionEl = document.querySelector(".item-description");
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