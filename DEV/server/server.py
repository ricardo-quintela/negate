import logging

from typing import Dict, Union
from flask import Flask, render_template, redirect, request, abort
from flask_socketio import SocketIO


from rooms import RoomData

app = Flask(
    __name__,
    static_url_path="",
    static_folder="static",
    template_folder="templates"
)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")



# configure logger
gunicorn_error_logger = logging.getLogger('gunicorn.error')
app.logger.handlers.extend(gunicorn_error_logger.handlers)
app.logger.setLevel(gunicorn_error_logger.level)


room_data = RoomData()


# json response annotation
JSONResponse = Dict[str, Union[str, int, float, bool]]

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
    opens a room on the API and redirects
    the user to it

    Returns:
        Response: redirects the user to the game room
    """

    # bad request
    if request.method != "GET":
        abort(400)

    args = request.args

    if "username" not in args:
        abort(404)

    username = args["username"]

    room_id = room_data.create_room()

    app.logger.debug("Opened room '%s'", room_id)
    return redirect(f"/game/{room_id}?username={username}")



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
    if room_data.get(room_id)["playerCount"] == 5:
        abort(403)

    return render_template("game.html", room_id=room_id, username=username)




#*==================================================================
#*                      TESTING ENDPOINTS
#*==================================================================


@app.route("/testing/create-room", methods=["POST"])
def testing_create_room() -> JSONResponse:
    """Creates a room in memory with the given ID

    Returns:
        JSONResponse: the room info in JSON format
    """
    # bad request
    if request.method != "POST":
        abort(400)

    payload = request.form

    if "roomId" not in payload:
        abort(400)

    room_id = room_data.create_room(payload["roomId"])

    return {
        "roomId": room_id,
        "roomData": room_data.get(room_id)
    }


@app.route("/testing/delete-room", methods=["DELETE"])
def testing_delete_room() -> JSONResponse:
    """Deletes a room in memory

    If the room does not exist, the returned roomData will be `None`

    Args:
        room_id (str): the id of the room to delete

    Returns:
        JSONResponse: the deleted room info
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
    socketio.run(app)
