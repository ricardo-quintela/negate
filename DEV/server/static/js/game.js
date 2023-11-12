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



/**
 *
 * @param {Element} mainEl the main element on the html body
 * @returns the game app itself
 */
function initializeApp(mainEl) {
    app = new PIXI.Application(
        {
            background: "#AAAAAA",
            resizeTo: window
        }
    );

    mainEl.innerHtml = "";
    mainEl.classList.add("hidden");

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

    const dPadPositions = [
        [CONTROLLER_SIZE * 3 + 10, app.screen.height - CONTROLLER_SIZE * 2],
        [CONTROLLER_SIZE * 2, app.screen.height - CONTROLLER_SIZE + 10],
        [CONTROLLER_SIZE - 10, app.screen.height - CONTROLLER_SIZE * 2],
        [CONTROLLER_SIZE * 2, app.screen.height - CONTROLLER_SIZE * 3 - 10],
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
        dPadButton.on("touchstart", (_) => socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: true }));
        dPadButton.on("touchend", (_) => socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: false }));

        // set mouse events
        dPadButton.on("mousedown", (_) => socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: true }));
        dPadButton.on("mouseup", (_) => socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: false }));

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
 * @param {String} mapFile the path to the map file
 * @param {PIXI.Spritesheet} roomsSpritesheet the room spritesheet data
 * @param {PIXI.Spritesheet} objectsSpritesheet the object and prop spritesheet data
 * @returns the map colliders
 */
async function loadMap(app, mapName, mapFile, roomsSpritesheet, objectsSpritesheet) {
    // declare the spritesheet file path
    PIXI.Assets.add({
        alias: mapName,
        src: mapFile
    });

    // load the map file to an object
    const map = await PIXI.Assets.load(mapName);

    // get the map room tiles and dimensions
    const roomLayer = map.layers[0].data;
    const roomWidth = map.layers[0].width;

    // load each map sprite
    var i = 0;
    var j = 0;
    for (const spriteIndex of roomLayer) {
        const texture = PIXI.Texture.from(Object.keys(roomsSpritesheet.textures)[spriteIndex - 1]);
        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(i * sprite.width, j * sprite.height);
        app.stage.addChild(sprite);

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
        const texture = PIXI.Texture.from(Object.keys(objectsSpritesheet.textures)[object.gid - 257]);
        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(object.x, object.y - sprite.height);
        app.stage.addChild(sprite);
    }

    // load the props
    const props = map.layers[2].objects;
    for (const prop of props) {
        const texture = PIXI.Texture.from(Object.keys(objectsSpritesheet.textures)[prop.gid - 257]);
        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(prop.x, prop.y - sprite.height);
        app.stage.addChild(sprite);
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


    return mapColliders;
}


/**
 * Loads all the player sprites and displays them on stage
 * @param {PIXI.Application} app the PIXI game app
 * @param {Object} playerData the current playerData
 * @param {String} socketId the id of the socket to ignore shared space rendering
 * @param {String} playerSpritesFile the file where the player sprites are located
 * @returns the players object
 */
async function loadPlayers(app, playerData, socketId, playerSpritesheet) {

    var players = {}

    for (const playerId of Object.keys(playerData)) {

        // ignore shared space socket
        if (playerId === socketId) continue;

        // create the player sprite and add it to the object
        const playerTexture = PIXI.Texture.from("char_1_idle_1.png");
        const player = new PIXI.Sprite(playerTexture);
        player.x = 100;
        player.y = 100;
        const playerCollider = new PIXI.Rectangle(
            player.x,
            player.y,
            player.width,
            player.height
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
 * @param {Object} players the players objects
 * @param {Array} mapColliders the map colliders
 */
function updatePlayers(socketId, mapColliders) {

    for (const playerId of Object.keys(playerData)) {

        // ignore shared space socket
        if (playerId === socketId) continue;

        // ignore not moving players
        if (!playerData[playerId].isMoving) {
            continue;
        }


        const previousX = players[playerId].hitbox.x;
        const previousY = players[playerId].hitbox.y;

        // move the player
        switch (playerData[playerId].facing) {

            case "up":
                players[playerId].hitbox.y -= PLAYER_SPEED;
                break;
            case "down":
                players[playerId].hitbox.y += PLAYER_SPEED;
                break;
            case "left":
                players[playerId].hitbox.x -= PLAYER_SPEED;
                break;
            case "right":
                players[playerId].hitbox.x += PLAYER_SPEED;
                break;

        }

        // cannot move so move to last position
        for (const collider of mapColliders) {
            if (collider.intersects(players[playerId].hitbox)) {
                players[playerId].hitbox.x = previousX;
                players[playerId].hitbox.y = previousY;
                break;
            }
            players[playerId].sprite.x = previousX;
            players[playerId].sprite.y = previousY;
        }
    }
}


