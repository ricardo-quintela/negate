
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