# pylint: disable=no-member
import logging

from flask import Flask, render_template, redirect, request, abort, Response
from flask.logging import default_handler
from flask_socketio import SocketIO, join_room as sio_join_room, leave_room as sio_leave_room

from json_validation import JSONDictionary, ValidateJson

from rooms import RoomData

app = Flask(
    __name__,
    static_url_path="",
    static_folder="static",
    template_folder="templates"
)
app.config["SECRET_KEY"] = "secret!"
socket_server = SocketIO(app, cors_allowed_origins="*")



# configure logger
gunicorn_error_logger = logging.getLogger('gunicorn.error')
app.logger.removeHandler(default_handler)
app.logger.handlers.extend(gunicorn_error_logger.handlers)
app.logger.setLevel(gunicorn_error_logger.level)

# Allocate space for the room data
room_data = RoomData()


# views

@app.route("/", methods=["GET"])
def home() -> str:
    """Home page where the create room
    should be issued

    Returns:
        str: the home view
    """
    # bad request
    if request.method != "GET":
        abort(400)

    return render_template("home.html")



@app.route("/create-room", methods=["GET"])
def create_room():
    """Randomly creates a room id;
    opens a room on the server and redirects
    the user to it

    Returns:
        Response: redirects the user to the game room
    """

    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    if "username" not in args:
        abort(400)

    username = args["username"]

    room_id = room_data.create_room()

    app.logger.debug("Opened room '%s'", room_id)

    return redirect(f"/game/{room_id}?username={username}", code=303)



@app.route("/join-room", methods=["GET"])
def join_room():
    """Attempts to join an existing room

    If the room doesn't exist a 404 code is returned

    Returns:
        Response: redirects the user to the game room
    """
    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    if "username" not in args:
        abort(400)

    if "roomId" not in args:
        abort(400)

    username = args["username"]
    room_id = args["roomId"]

    # room doesn't exist
    if room_id not in room_data:
        abort(404)

    app.logger.debug("Player joined room '%s'", room_id)

    return redirect(f"/game/{room_id}?username={username}", code=303)


@app.route("/game/<room_id>", methods=["GET"])
def game(room_id: str):
    """Connects the user to the room
    with the given id; If the room does not exist
    a 404 is raised

    The user does not connect via a websocket tcp connection to the room,
    instead the HTTPResponse is given and the client must actively connect via
    a `join` event

    Args:
        room_id (str): the room identifier (must exist in memory)

    Returns:
        str: the customized room view
    """

    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    # username not in params
    if "username" not in args:
        abort(400)

    username = args["username"]

    # room does not exist
    if room_id not in room_data:
        abort(404)

    # room is full
    if room_data.get_player_count(room_id) == 5:
        abort(403)

    return render_template("game.html", room_id=room_id, username=username)

@app.route("/resource", methods=["GET"])
def load_resource():
    """Renders a component template

    If the room id valid and the player is connected
    to the socket then the resource is rendered

    Returns:
        str: the rendered template
    """
    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    # resource not in params
    if "resource" not in args:
        abort(400)
    resource = args["resource"]

    # username not in params
    if "roomId" not in args:
        abort(400)
    room_id = args["roomId"]


    # playerId not in params
    if "playerId" not in args:
        abort(400)
    player_id = args["playerId"]


    # isSharedSpace not in params
    if "isSharedSpace" not in args:
        abort(400)
    is_shared_space = True if args["isSharedSpace"] == "true" else False

    player_data = room_data.get_players(room_id)

    # room does not exist
    if player_data is None:
        abort(404)

    # forbidden -> player not in game
    if player_id not in player_data:
        abort(403)

    if room_data.get_players(room_id)[player_id]["character"] == -1:
        app.logger.debug(
            "Rendered '%s' for player '%s'",
            resource, room_data.get_players(room_id)[player_id]["username"]
        )
    else:
        app.logger.debug(
            "Rendered '%s' for player '%s'",
            resource, room_data.get_players(room_id)[player_id]["character"]
        )

    # render the template
    return render_template(
        f"components/{resource}.html",
        room_id=room_id,
        player_id=player_id,
        room_data=room_data.get(room_id),
        is_shared_space=is_shared_space
    )


#*==================================================================
#*                      WEBSOCKET EVENTS
#*==================================================================

@socket_server.on("join")
def event_join(json: JSONDictionary):
    """Join

    This event is issued whenever a player wishes to join an existing room

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'join'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "username"):
        return

    room_id = json["roomId"]
    username = json["username"]

    # connect the player to the socket room
    sio_join_room(room_id)

    # get the socket id
    socket_id = request.sid

    if room_id not in room_data:
        return


    # add the player to the room data
    room_data.add_player(room_id, socket_id, username)

    app.logger.debug(
        "Player '%s' joined room '%s'",
        room_data.get_players(room_id)[socket_id]["username"], room_id
    )

    # send player data to all players
    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)

    app.logger.debug("Sent player data to all in room '%s'", room_id)



@socket_server.on("leave")
def event_leave(json: JSONDictionary):
    """Leave

    This event is issued whenever a player leaves the room
    hey're connected to

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'leave'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId"):
        return

    room_id = json["roomId"]

    # disconnect the player to the socket room
    sio_leave_room(room_id)

    # get the socket id
    socket_id = request.sid

    if room_id not in room_data:
        return

    app.logger.debug("Disconnected '%s' from room '%s'", socket_id, room_id)

    # add the player to the room data
    room_data.remove_player(room_id, socket_id)

    # send player data to all players
    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)

    app.logger.debug("Sent player data to all in room '%s'", room_id)

    # delete the room
    if room_data.get_player_count(room_id) == 0:
        room_data.delete(room_id)
        app.logger.debug("Deleted room '%s': No players left", room_id)



@socket_server.on("ready")
def event_ready(json: JSONDictionary):
    """Ready

    This event is issued whenever a player changes it's ready state

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'ready'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "isReady"):
        return

    room_id = json["roomId"]
    is_ready = json["isReady"]

    # get the socket id
    socket_id = request.sid

    if room_id not in room_data:
        return

    room_data.get_players(room_id)[socket_id]["isReady"] = is_ready

    if is_ready:
        app.logger.debug(
            "Player '%s' is ready",
            room_data.get_players(room_id)[socket_id]["username"]
        )
    else:
        app.logger.debug(
            "Player '%s' is not ready",
            room_data.get_players(room_id)[socket_id]["username"]
        )

    # send player data to all players
    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)
    app.logger.debug("Sent player data to all in room '%s'", room_id)


@socket_server.on("lockIn")
def event_lock_in(json: JSONDictionary):
    """LockIn

    This event is issued whenever a player locks the character
    that they want to play with

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'lockIn'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "character"):
        return

    room_id = json["roomId"]
    character = json["character"]

    # get the socket id
    socket_id = request.sid

    if room_id not in room_data:
        return

    # set the player's character
    room_data.get_players(room_id)[socket_id]["character"] = character
    app.logger.debug(
        "Player '%s' selected character '%s'",
        room_data.get_players(room_id)[socket_id]["username"],
        character,
    )

    data = room_data.get_players(room_id)


    # send player data to all players
    socket_server.emit(
        "characterData",
        {sid: {"character": data[sid]["character"]} for sid in data},
        to=room_id
    )
    app.logger.debug("Sent character data to all in room '%s'", room_id)



@socket_server.on("movePlayer")
def event_move_player(json: JSONDictionary):
    """MovePlayer

    This event is issued whenever a player presses or
    releases a movement button

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'movePlayer'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "key", "state"):
        return

    room_id = json["roomId"]
    state = json["state"]
    facing = json["key"]

    # get the socket id
    socket_id = request.sid

    if room_id not in room_data:
        return

    data = room_data.set_moving_state(room_id, socket_id, state, facing)

    # room doesn't exist
    if data is None:
        return

    if state:
        app.logger.debug(
            "Player '%s' is moving '%s'",
            room_data.get_players(room_id)[socket_id]["character"],
            facing
        )
    else:
        app.logger.debug(
            "Player '%s' stopped moving",
            room_data.get_players(room_id)[socket_id]["character"]
        )


    # send player data to all players
    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)
    app.logger.debug("Sent player data to all in room '%s'", room_id)




@socket_server.on("setInteractPermission")
def event_set_interact_permission(json: JSONDictionary):
    """SetInteractPermission

    This event is issued whenever a player is near an interactable
    or whenerer they leave the interactable area

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'setInteractPermission'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "playerId", "state", "interactableId", "target"):
        return

    room_id = json["roomId"]
    player_id = json["playerId"]
    state = json["state"]
    interactable_id = json["interactableId"]
    target = json["target"]

    # vallidating the json payload on the target -> the target can be None
    if target is not None:
        # validate the target json data
        if not ValidateJson.validate_keys(target, "type", "name"):
            return

        # validate target format
        if target["type"] not in {"item", "document"}:
            return

        # validate the target content and format
        if target["type"] == "document" and "content" not in target:
            return

        # validate the target content and format
        if target["type"] == "item" and "content" not in target and "img" not in target:
            return

    if room_id not in room_data:
        return

    data = room_data.set_interaction_state(room_id, player_id, state)

    # room doesn't exist
    if data is None:
        return

    player_data = room_data.get_players(room_id)


    if player_data[player_id]["isInteracting"]:
        app.logger.debug(
            "Player '%s' can interact with '%s'",
            room_data.get_players(room_id)[player_id]["character"],
            interactable_id
        )
    else:
        app.logger.debug(
            "Player '%s' can no longer interact",
            room_data.get_players(room_id)[player_id]["character"]
        )


    item_data = {
        player_id: {
            "isInteracting": player_data[player_id]["isInteracting"],
            "interactableId": interactable_id,
            "target": target
        }
    }

    # send player data to all players
    socket_server.emit("itemData", item_data, to=room_id)
    app.logger.debug("Sent item data to all in room '%s'", room_id)




@socket_server.on("interact")
def event_interact(json: JSONDictionary):
    """Interact

    This event is fired whenever a player clicks on the interact button

    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'interact'")

    # validates the dict
    if not ValidateJson.validate_keys(json, "roomId", "interactableId"):
        return

    room_id = json["roomId"]
    interactable_id = json["interactableId"]
    socket_id = request.sid

    if room_id not in room_data:
        return

    app.logger.debug(
        "Player '%s' interacted with '%s'",
        room_data.get_players(room_id)[socket_id]["character"],
        interactable_id
    )

    # send player data to all players
    socket_server.emit(
        "playerInteraction",
        {
            "playerId": socket_id,
            "interactableId": interactable_id
        },
        to=room_id
    )
    app.logger.debug("Sent interaction data to all in room '%s'", room_id)



@socket_server.on("sendItem")
def event_send_item(json: JSONDictionary):
    """SentItem

    This event is issued whenever a player 
    presses the button to send an item
    Args:
        json (JSONDictionary): the json payload
    """
    app.logger.debug("Triggered event 'sendItem'")

    if not ValidateJson.validate_keys(json, "roomId", "receiverId", "itemIndex", "item"):
        return

    room_id = json["roomId"]
    item = json["item"]
    item_id = json["itemIndex"]
    receiver_id = json["receiverId"]
    socket_id = request.sid

    if room_id not in room_data:
        return


    app.logger.debug(
        "Item '%s' sent from player '%s' to player '%s'",
        item["name"],
        room_data.get_players(room_id)[socket_id]["character"],
        room_data.get_players(room_id)[receiver_id]["character"]
    )

    socket_server.emit(
        "playerSend",
        {
                "item": item,
                "receiverId": receiver_id,
                "itemIndex": item_id,
                "senderId" : socket_id
        },
        to=room_id
    )
    app.logger.debug("Sent item data to all in room '%s'", room_id)


@socket_server.on("testingClick")
def event_testing_click(json: JSONDictionary):
    """TestingClick

    This event is issued whenever a player 
    opens the inventory

    TESTING ONLY

    Args:
        json (JSONDictionary): the json payload
    """

    app.logger.debug("Triggered event testingClick")

    if not ValidateJson.validate_keys(json, "roomId", "message"):
        return

    room_id = json["roomId"]
    message = json["message"]
    socket_id = request.sid

    if room_data.get_players(room_id)[socket_id]["character"] == -1:
        app.logger.debug(
            "Player '%s' %s",
            room_data.get_players(room_id)[socket_id]["username"],
            message
        )
    else:
        app.logger.debug(
            "Player '%s' %s",
            room_data.get_players(room_id)[socket_id]["character"],
            message
        )


#*==================================================================
#*                      TESTING ENDPOINTS
#*==================================================================



@app.route("/testing/create-room", methods=["GET"])
def testing_create_room() -> JSONDictionary:
    """Creates a room in memory with the given ID

    Returns:
        JSONDictionary: the room info in JSON format
    """
    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    # validate the payload
    if "roomId" not in args:
        abort(400)

    room_id = room_data.create_room(args["roomId"])

    app.logger.debug("New testing session started on room '%s'", room_id)

    return {
        "roomId": room_id,
        "roomData": room_data.get(room_id)
    }


@app.route("/testing/delete-room", methods=["DELETE"])
def testing_delete_room() -> JSONDictionary:
    """Deletes a room in memory

    If the room does not exist, the returned roomData will be `None`

    Args:
        room_id (str): the id of the room to delete

    Returns:
        JSONDictionary: the deleted room info
    """
    # bad request
    if request.method != "DELETE":
        abort(400)

    args = request.args

    if "roomId" not in args:
        abort(400)

    room_id = args["roomId"]

    app.logger.debug("Deleted room '%s'", room_id)

    return {
        "roomId": room_id,
        "roomData": room_data.delete(room_id)
    }



#*==================================================================
#*                      ERROR CODE HANDLERS
#*==================================================================

@app.errorhandler(400)
def error_code_bad_request(error) -> Response:
    """Handles an error code by returning
    an HTML HTTPResponse

    Args:
        error (_type_): the error

    Returns:
        Response: the HTTPResponse with the rendered template
    """
    return render_template('error/400.html', error=error), 400

@app.errorhandler(403)
def error_code_forbidden(error) -> Response:
    """Handles an error code by returning
    an HTML HTTPResponse

    Args:
        error (_type_): the error

    Returns:
        Response: the HTTPResponse with the rendered template
    """
    return render_template('error/403.html', error=error), 403

@app.errorhandler(404)
def error_code_not_found(error) -> Response:
    """Handles an error code by returning
    an HTML HTTPResponse

    Args:
        error (_type_): the error

    Returns:
        Response: the HTTPResponse with the rendered template
    """
    return render_template('error/404.html', error=error), 404

@app.errorhandler(500)
def error_code_internal_server_error(error) -> Response:
    """Handles an error code by returning
    an HTML HTTPResponse

    Args:
        error (_type_): the error

    Returns:
        Response: the HTTPResponse with the rendered template
    """
    return render_template('error/500.html', error=error), 500




if __name__ == "__main__":
    socket_server.run(app)
