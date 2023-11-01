# pylint: disable=no-member
import logging

from flask import Flask, render_template, redirect, request, abort
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

    app.logger.debug("Joined '%s' to room '%s'", socket_id, room_id)

    # add the player to the room data
    room_data.add_player(room_id, socket_id, username)

    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)

    app.logger.debug("Sent player data to all in room '%s'", room_id)



@socket_server.on("leave")
def event_leave(json: JSONDictionary):
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

    socket_server.emit("playerData", room_data.get_players(room_id), to=room_id)

    app.logger.debug("Sent player data to all in room '%s'", room_id)

    # delete the room
    if room_data.get_player_count(room_id) == 0:
        room_data.delete(room_id)
        app.logger.debug("Deleted room '%s': No players left", room_id)



#*==================================================================
#*                      TESTING ENDPOINTS
#*==================================================================



@app.route("/testing/create-room", methods=["POST"])
def testing_create_room() -> JSONDictionary:
    """Creates a room in memory with the given ID

    Returns:
        JSONDictionary: the room info in JSON format
    """
    # bad request
    if request.method != "POST":
        abort(400)

    payload = request.form

    # validate the payload
    if not ValidateJson.validate_keys(payload, "roomId"):
        abort(400)

    room_id = room_data.create_room(payload["roomId"])

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

    return {
        "roomId": room_id,
        "roomData": room_data.delete(room_id)
    }


if __name__ == "__main__":
    socket_server.run(app)
