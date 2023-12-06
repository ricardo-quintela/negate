/**
 * Annotates the dpad buttons order
 */
const dPadMovement = {
    0: "right",
    1: "down",
    2: "left",
    3: "up",
}

const PLAYER_SPEED = 5;
const INTERACT_REACH = 80;
const HITBOX_HEIGHT_RATIO = 1/4; // raletion of the hitbox height and the sprite height


/**
 *
 * @param {Element} mainEl the main element on the html body
 * @param roomId
 * @param playerId
 * @param isSharedSpace
 * @returns the game app itself
 */
function initializeApp(mainEl, roomId, playerId, isSharedSpace) {
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

    app = new PIXI.Application(
        {
            background: "#AAAAAA",
            resizeTo: window
        }
    );
    mainEl.innerHTML = "";
    mainEl.classList.add("hidden");
    if (!isSharedSpace) {
        document.body.innerHTML += requestResource("canvas_overlay", roomId, playerId, isSharedSpace);
    }
    document.body.appendChild(app.view);
    return app;
}

/**
 * Draws a controller on the screen that can be clicked
 * @param {PIXI.Application} app the game app
 * @returns the controller object containing all the dpad buttons
 */
function loadController(app) {

    const CONTROLLER_SIZE = 50;

    // get the supposed height to fix the controller positioning
    const height = app.screen.height < app.screen.width ? app.screen.height : app.screen.width;

    const dPadPositions = [
        [CONTROLLER_SIZE * 3 + 10, height - CONTROLLER_SIZE * 2],
        [CONTROLLER_SIZE * 2, height - CONTROLLER_SIZE + 10],
        [CONTROLLER_SIZE - 10, height - CONTROLLER_SIZE * 2],
        [CONTROLLER_SIZE * 2, height - CONTROLLER_SIZE * 3 - 10],
    ];

    var controller = {
        up: null,
        down: null,
        left: null,
        right: null
    }


    for (var i = 0; i < 4; i++) {
        const dPadButton = new PIXI.Graphics();

        // drawing the directional button
        dPadButton.beginFill(0xFFFFFF);
        dPadButton.drawPolygon(0, 0, CONTROLLER_SIZE, CONTROLLER_SIZE / 2, 0, CONTROLLER_SIZE);
        dPadButton.endFill();

        // position and rotate the dpad key
        dPadButton.pivot.x = dPadButton.width / 2;
        dPadButton.pivot.y = dPadButton.height / 2;
        dPadButton.angle = 90 * i;
        dPadButton.position = new PIXI.Point(dPadPositions[i][0], dPadPositions[i][1]);

        const index = i;

        // enable interaction with the dpad keys
        dPadButton.eventMode = "static";
        dPadButton.interactive = true;

        // set touchevents
        dPadButton.on("touchstart", (event) => {
            event.preventDefault(); // prevent selection
            socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: true });
        });
        dPadButton.on("touchend", (event) => {
            event.preventDefault(); // prevent selection
            socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: false });
        });

        // set mouse events
        dPadButton.on("mousedown", (event) => {
            event.preventDefault(); // prevent selection
            socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: true });
        });
        dPadButton.on("mouseup", (event) => {
            event.preventDefault(); // prevent selection
            socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: false });
        });

        // add the child to the stage
        app.stage.addChild(dPadButton);


        controller[dPadMovement[index]] = dPadButton;
    }

    return controller

}

/**
 * Loads the spritesheet
 * @returns the spritesheet object
 */
async function loadSprites(spritesheetName, spritesheetDataFile) {

    // declare the spritesheet file path
    PIXI.Assets.add({
        alias: spritesheetName,
        src: spritesheetDataFile
    });

    // load the spritesheet
    return await PIXI.Assets.load(spritesheetName);
}



/**
 *
 * @param {PIXI.Application} app the PIXIjs game app
 * @param {String} mapName the name given to the map
 * @param {PIXI.Spritesheet} roomsSpritesheet the room spritesheet data
 * @param {PIXI.Spritesheet} objectsSpritesheet the object and prop spritesheet data
 * @returns the map colliders and interactables
 */
async function loadMap(app, mapName, roomsSpritesheet, objectsSpritesheet) {
    // declare the spritesheet file path
    PIXI.Assets.add({
        alias: mapName,
        src: `/maps/${mapName}.json`
    });

    PIXI.Assets.add({
        alias: `${mapName}_items`,
        src: `/maps/items/${mapName}_items.json`
    });

    // load the map file to an object
    const map = await PIXI.Assets.load(mapName);
    const mapInteractables = await PIXI.Assets.load(`${mapName}_items`);

    // get the map room tiles and dimensions
    const roomLayer = map.layers[0].data;
    const roomWidth = map.layers[0].width;

    // load each map sprite
    var i = 0;
    var j = 0;
    for (const spriteIndex of roomLayer) {

        if (spriteIndex - map.tilesets[0].firstgid !== -1) {
            const texture = PIXI.Texture.from(Object.keys(roomsSpritesheet.textures)[spriteIndex - map.tilesets[0].firstgid]);
            const sprite = new PIXI.Sprite(texture);
            sprite.position.set(i * sprite.width, j * sprite.height);
            app.stage.addChild(sprite);
        }

        if (i < roomWidth - 1) {
            i++;
            continue;
        }
        i = 0;
        j++;
    }

    // load the objects
    const objects = map.layers[1].objects;
    for (const object of objects) {
        const texture = PIXI.Texture.from(Object.keys(objectsSpritesheet.textures)[object.gid - map.tilesets[1].firstgid]);
        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(object.x, object.y - sprite.height);
        app.stage.addChild(sprite);
    }

    const propQueue = {};
    // load the props
    const props = map.layers[2].objects;
    for (const prop of props) {
        // load the texture
        const texture = PIXI.Texture.from(Object.keys(objectsSpritesheet.textures)[prop.gid - map.tilesets[1].firstgid]);
        // build the sprite
        const sprite = new PIXI.Sprite(texture);

        // create the highlight of the sprite sprite
        // create a white sprite
        const highlight = new PIXI.Graphics();
        highlight.beginFill(0xFFFFFF);
        highlight.drawRect(0,0, prop.width, prop.height);
        highlight.endFill();

        // mask the highlight with the prop's shape
        const mask = new PIXI.Sprite(texture);
        highlight.addChild(mask);
        highlight.mask = mask;

        // set the highlight as invisible
        highlight.visible = false;

        // get the id of the prop from its properties
        const propId = prop.properties[2].value;

        // get the character that can interact with the prop
        const characterId = prop.properties[0].value;

        // get the required item id to use the item
        const requiredItemId = prop.properties[1].value;

        // initialize the prop data if it hasn't been already
        if (!(propId in propQueue)) {
            propQueue[propId] = {
                position: {x: -1, y: -1}, // position reset
                sprites: [],
                active: true,
                characterId: characterId,
                requiredItemId: requiredItemId,
                target: mapInteractables.targets[propId]
            };
        }

        // push the prop into the queue on the corresponding prop id
        propQueue[propId].sprites.push(
            {
                position: {
                    x: prop.x,
                    y: prop.y
                },
                sprite: sprite,
                highlight: highlight,
            }
        );

        // set the sprite and highlight positions
        sprite.position.set(prop.x, prop.y - sprite.height);
        highlight.position.set(prop.x, prop.y - sprite.height);

        // calculate the center of the prop
        const propPosition = propQueue[propId].sprites.reduce(
            (accumulator, sprite) => {
                accumulator.x += sprite.position.x;
                accumulator.y += sprite.position.y;
                return accumulator;
            },
            {x:0, y:0}
        );
        // set the center position of the prop
        propQueue[propId].position.x = propPosition.x / propQueue[propId].sprites.length;
        propQueue[propId].position.y = propPosition.y / propQueue[propId].sprites.length;

        // add the sprite and highlight to the stage
        app.stage.addChild(sprite);
        app.stage.addChild(highlight);

    }

    // load the colliders
    const colliders = map.layers[3].objects;

    // initialize a colliders array
    var mapColliders = [];

    // create and fill the colliders array with collider objects
    for (const collider of colliders) {
        const mapCollider = new PIXI.Rectangle(
            collider.x,
            collider.y,
            collider.width,
            collider.height
        );

        mapColliders.push(mapCollider);
    }

    // get the players spawns
    const spawns = map.layers[4].objects;

    return {colliders: mapColliders, interactables: propQueue, playerSpawns: spawns};
}

/**
 * Loads the character animation for each one of the characters
 * @param {Array} characterSpritesheetFiles the character sprites file names
 * @returns an array with the animation set for each one of the characters
 */
async function loadCharacterSpritesheets(characterSpritesheetFiles) {

    const characterAnimations = [];

    // load the sprites for each character
    for (var charNum = 0; charNum < 4; charNum++) {
        const spritesheet = await loadSprites(`char${charNum + 1}`, characterSpritesheetFiles[charNum]);

        const textureArray = [];
        for (const textureFile of Object.keys(spritesheet.textures)) {
            textureArray.push(PIXI.Texture.from(textureFile));
        }

        // getting the texture arrays
        const characterSprites = {
            idleR: [textureArray[0]],
            idleU: [textureArray[1]],
            idleL: [textureArray[2]],
            idleD: [textureArray[3]],
            walkR: textureArray.slice(4, 10),
            walkU: textureArray.slice(10, 16),
            walkL: textureArray.slice(16, 22),
            walkD: textureArray.slice(22, 28)
        }

        characterAnimations.push(characterSprites);
    }

    return characterAnimations;
}


/**
 * Loads all the player sprites and displays them on stage
 * @param {PIXI.Application} app the PIXI game app
 * @param {Object} playerData the current playerData
 * @param {String} socketId the id of the socket to ignore shared space rendering
 * @param {String} characterAnimations the animation set for each one of the characters
 * @returns the players object
 */
async function loadPlayers(app, playerData, socketId, characterAnimations, playerSpawns) {

    var players = {}

    for (const playerId of Object.keys(playerData)) {

        // ignore shared space socket
        if (playerId === socketId) continue;

        // create the player sprite and add it to the object
        const player = new PIXI.AnimatedSprite(characterAnimations[playerData[playerId].character].idleR);
        player.animationSpeed = 0.1;
        player.loop = false;

        // scale by 2x
        player.setTransform(0, 0, 2, 2, 0, 0, 0, 0, 0);

        // position
        player.x = playerSpawns[playerData[playerId].character].x;
        player.y = playerSpawns[playerData[playerId].character].y;
        const playerCollider = new PIXI.Rectangle(
            player.x,
            player.y + ((1 - HITBOX_HEIGHT_RATIO) * player.height),
            player.width,
            player.height * HITBOX_HEIGHT_RATIO
        );

        players[playerId] = {
            sprite: player,
            hitbox: playerCollider,
        }

        // add sprite to the stage
        app.stage.addChild(player);

    }

    return players;

}


/**
 * 
 * @param {String} socketId the socket id to ignore
 * @param {Array} mapColliders the map colliders
 * @param {Object} characterAnimations the character animated sprites
 */
function updatePlayers(socketId, mapColliders, characterAnimations) {

    for (const playerId of Object.keys(playerData)) {

        // ignore shared space socket
        if (playerId === socketId) continue;

        // ignore not moving players
        if (!playerData[playerId].isMoving) {

            // idle animations
            switch (playerData[playerId].facing) {
                case "up":
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].idleU;
                    break;
                case "down":
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].idleD;
                    break;
                case "left":
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].idleL;
                    break;
                case "right":
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].idleR;
                    break;
            }
            continue;
        }

        // save the hitbox position
        const previousX = players[playerId].hitbox.x;
        const previousY = players[playerId].hitbox.y;

        // move the player
        switch (playerData[playerId].facing) {

            case "up":
                players[playerId].hitbox.y -= PLAYER_SPEED;

                if (!players[playerId].sprite.playing) {
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].walkU;
                }
                break;
            case "down":
                players[playerId].hitbox.y += PLAYER_SPEED;

                if (!players[playerId].sprite.playing) {
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].walkD;
                }
                break;
            case "left":
                players[playerId].hitbox.x -= PLAYER_SPEED;

                if (!players[playerId].sprite.playing) {
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].walkL;
                }
                break;
            case "right":
                players[playerId].hitbox.x += PLAYER_SPEED;

                if (!players[playerId].sprite.playing) {
                    players[playerId].sprite.textures = characterAnimations[playerData[playerId].character].walkR;
                }
                break;
        }

        // play the animation
        if (!players[playerId].sprite.playing) {
            players[playerId].sprite.play();
        }

        // cannot move so move to last position
        for (const collider of mapColliders) {
            if (collider.intersects(players[playerId].hitbox)) {
                players[playerId].hitbox.x = previousX;
                players[playerId].hitbox.y = previousY;
                break;
            }
            players[playerId].sprite.x = players[playerId].hitbox.x;
            players[playerId].sprite.y = (players[playerId].hitbox.y + players[playerId].hitbox.height) - players[playerId].sprite.height;
        }
    }
}


/**
 * Calculates the distance between players and interactables and
 * sets the player to be able to interact
 * @param {String} socketId the socket id to ignore (shared space)
 * @param {Object} interactables the map interactables
 */
function calcultateInteractions(socketId, interactables) {

    var playerInteractGroup = {};

    // iterate through all the interactables and check player interactability
    var targetInteractableIds = {};
    for (const targetId of Object.keys(interactables)) {

        // set the highlight to invisible
        interactables[targetId].sprites.forEach(sprite => {
            sprite.highlight.visible = false;
        });

        // check interact distance for every player
        for (const playerId of Object.keys(playerData)) {

            // ignore shared space socket
            if (playerId === socketId) continue;

            var canInteract;

            // ignore the interaction if the prop is not active or the player's inventory doesn't have the required item
            if (!interactables[targetId].active || (interactables[targetId].requiredItemId !== "" && !playerInventories[playerId].includes(interactables[targetId].requiredItemId))) {
                
                canInteract = false;
            } else {

                // if the character cannot interact with the item
                if (interactables[targetId].characterId !== -1 && playerData[playerId].character !== interactables[targetId].characterId) {
                    canInteract = false;
                } else {
                    // set the interactable to visible or not
                    const distance = calculateDistance(players[playerId].hitbox, interactables[targetId].position);
                    canInteract = distance < INTERACT_REACH;
                }
                
            }


            // set the targetId if the player can interact with the prop
            if (!(playerId in targetInteractableIds)) {
                targetInteractableIds[playerId] = canInteract ? targetId : null;
            } else {
                targetInteractableIds[playerId] = canInteract ? targetId : targetInteractableIds[playerId];
            }


            if (playerId in playerInteractGroup) {
                playerInteractGroup[playerId] = playerInteractGroup[playerId] ? true : canInteract;
            } else {
                playerInteractGroup[playerId] = canInteract;
            }

        }

        // item can be interacted with
        for (const playerId of Object.keys(targetInteractableIds)){
            if (targetInteractableIds[playerId] === null) continue;

            interactables[targetInteractableIds[playerId]].sprites.forEach(sprite => {
                sprite.highlight.visible = true;
            });
        }

    }


    for (const playerId of Object.keys(targetInteractableIds)) {
        if (playerInteractGroup[playerId] === playerData[playerId].isInteracting) continue;
        
        // set the target to the target object or null if it can't be interacted
        const target = targetInteractableIds[playerId] !== null ? interactables[targetInteractableIds[playerId]].target : null;
        
        // allow the event to be called only once
        if (playerData[playerId].isInteracting !== playerInteractGroup[playerId]) {                
            
            playerData[playerId].isInteracting = playerInteractGroup[playerId];
            
            // send interact data to the server
            socket.emit("setInteractPermission", {
                roomId: roomId,
                playerId: playerId,
                state: playerInteractGroup[playerId],
                interactableId: targetInteractableIds[playerId],
                target: target
            });
        }
    }
    
}
