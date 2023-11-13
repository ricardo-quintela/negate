
/**
 * Returns a rendered component based on the room context
 * @param {String} resource the resource name to load
 * @param {String} roomId the id of the room
 * @param {String} playerId the id of the player
 * @returns the server side rendered component
 */
function requestResource(resource, roomId, playerId, isSharedSpace) {
    const http = new XMLHttpRequest();
    http.open("GET", `/resource?resource=${resource}&roomId=${roomId}&playerId=${playerId}&isSharedSpace=${isSharedSpace}`, false);
    http.send();

    if (http.status === 200) return http.responseText;
    return null;
}

/**
 * Calculates the distance between two points
 * @param {Object} player the player's hitbox
 * @param {Object} interactable the interactable's hitbox
 * @returns the distance between both
 */
function calculateDistance(player, interactable) {

    const playerPos = [player.x, player.y];
    const intPos = [interactable.x, interactable.y];

    return Math.sqrt(Math.pow(playerPos[0] - intPos[0], 2) + Math.pow(playerPos[1] - intPos[1], 2));

}