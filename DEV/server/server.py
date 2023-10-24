from typing import TypedDict, Dict, List
from random import randint
import os

from flask import Flask, render_template, redirect, request, abort
from flask_socketio import SocketIO, join_room, leave_room, close_room, emit


ROOM_ID_LEN = 5

class RoomInfo(TypedDict):
    """Annotates information about how the room info
    """
    playerCount: int
    players: List[str]
    ready: List[str]

HTMLElement = str



app = Flask(
    __name__,
    static_url_path="",
    static_folder="static",
    template_folder="templates"    
)
app.config["SECRET_KEY"] = "secret!"
socketio = SocketIO(app, cors_allowed_origins="*")

rooms: Dict[str, RoomInfo] = dict()


@app.route("/")
def home() -> str:
    app.logger.debug("Request to '/'")
    return render_template("home.html")



@app.route("/create-room")
def create_room():
    args = request.args

    if "username" not in args:
        abort(404)

    username = args["username"]

    room_id = ""

    while True:
        for _ in range(ROOM_ID_LEN):
            ascii_code = randint(ord("A"), ord("Z"))
            room_id += chr(ascii_code)

        if room_id not in rooms:
            break

        room_id = ""

    rooms[room_id] = {"playerCount": 1, "players": [username], "ready": list()}

    app.logger.info("Opened new room '%s'", room_id)

    return redirect(f"/game/{room_id}")


@app.route("/game/<room_id>")
def game(room_id: str):

    if room_id not in rooms:
        abort(404)

    if rooms[room_id]["playerCount"] == 5:
        abort(404)

    return render_template("game.html", room_id=room_id)

if __name__ == "__main__":
    socketio.run(app)
