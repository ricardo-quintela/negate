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
