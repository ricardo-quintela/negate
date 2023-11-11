/**
 * Annotates the dpad buttons order
 */
const dPadMovement = {
    0: "right",
    1: "down",
    2: "left",
    3: "up",
}

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
        dPadButton.drawPolygon(0,0, CONTROLLER_SIZE,CONTROLLER_SIZE/2, 0,CONTROLLER_SIZE);
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
        dPadButton.on("mouseup", (_) => socket.emit("movePlayer", { roomId: roomId, key: dPadMovement[index], state: true }));

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


}
