
/**
 * Returns a rendered component based on the room context
 * @param {String} resource the resource name to load
 * @param {String} roomId the id of the room
 * @param {String} playerId the id of the player
 * @param {Boolean} isSharedSpace weather the client is the shared space or not
 * @returns the server side rendered component
 */
function requestResource(resource, roomId, playerId, isSharedSpace) {
    const http = new XMLHttpRequest();
    http.open("GET", `/resource?resource=${resource}&roomId=${roomId}&playerId=${playerId}&isSharedSpace=${isSharedSpace}`, false);
    http.send();

    if (http.status === 200) return http.responseText;
    return null;
}