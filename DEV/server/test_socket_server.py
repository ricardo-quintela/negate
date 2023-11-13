# pylint: skip-file
"""Tests the rest server
"""
import pytest
from flask import Flask
from flask.testing import FlaskClient
from flask_socketio.test_client import SocketIOTestClient

from server import app, socket_server, room_data
from rooms import RoomData


@pytest.fixture
def rooms():
    """Creates a new room

    Drops it after not being used

    Yields:
        RoomData: a room data object with one room inside
    """
    room_data.create_room("AAAAA")
    yield room_data
    room_data.delete("AAAAA")

#*================================================================

@pytest.fixture
def rest_api():
    app.config.update(
        {"TESTING": True}
    )
    return app

#*================================================================


@pytest.fixture
def client(rest_api: Flask) -> FlaskClient:
    return rest_api.test_client()

@pytest.fixture
def socket(rest_api: Flask) -> SocketIOTestClient:
    return socket_server.test_client(rest_api)

#*================================================================



def test_websocket_connected(socket: SocketIOTestClient):
    """Test if the connection is established
    """
    assert socket.is_connected() is True


def test_websocket_event_join(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after join event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient"
    })

    events = socket.get_received()

    assert events[0]["name"] == "playerData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "username": "testClient",
            "isReady": False,
            "character": -1,
            "position": [0,0],
            "facing": "right",
            "isMoving": False,
            "isInteracting": False
        }


def test_websocket_event_leave(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after leave room event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient2"
    })

    socket.emit("leave", {
        "roomId": "AAAAA"
    })

    assert rooms.get("AAAAA") == None

def test_websocket_event_ready(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after leave event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient3"
    })
    socket.get_received()

    socket.emit("ready", {
        "roomId": "AAAAA",
        "isReady": True
    })

    events = socket.get_received()

    assert events[0]["name"] == "playerData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "username": "testClient3",
            "isReady": True,
            "character": -1,
            "position": [0,0],
            "facing": "right",
            "isMoving": False,
            "isInteracting": False,
        }


def test_websocket_event_lock_in(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a characterData event to
    everyone connected after lockIn event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient3"
    })
    socket.get_received()

    socket.emit("lockIn", {
        "roomId": "AAAAA",
        "character": 100
    })

    events = socket.get_received()

    assert events[0]["name"] == "characterData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "character": 100
        }


def test_load_resource(socket: SocketIOTestClient, rooms: RoomData, client: FlaskClient):

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient4"
    })
    player_id = list(socket.get_received()[0]["args"][0].keys())[0]

    response = client.get(f"/resource?resource=test/test_component&roomId=AAAAA&playerId={player_id}&isSharedSpace=false")

    assert response.status_code == 200



def test_websocket_event_move_player(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after movePlayer event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient5"
    })
    socket.get_received()

    socket.emit("movePlayer", {
        "roomId": "AAAAA",
        "key": "up",
        "state": True
    })

    events = socket.get_received()

    assert events[0]["name"] == "playerData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "username": "testClient5",
            "isReady": False,
            "character": -1,
            "position": [0,0],
            "facing": "up",
            "isMoving": True,
            "isInteracting": False,
        }
    

def test_websocket_event_set_interact_permission_document(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after setInteractPermission event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient6"
    })
    player_id = list(socket.get_received()[0]["args"][0].keys())[0]

    socket.emit("setInteractPermission", {
        "roomId": "AAAAA",
        "playerId": player_id,
        "state": True,
        "target": {
            "type": "document",
            "name": "test document",
            "content": "test content"
        }
    })

    events = socket.get_received()

    assert events[0]["name"] == "itemData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "isInteracting": True,
            "target": {
                "type": "document",
                "name": "test document",
                "content": "test content"
            }
        }


def test_websocket_event_set_interact_permission_item(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after setInteractPermission event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient6"
    })
    player_id = list(socket.get_received()[0]["args"][0].keys())[0]

    socket.emit("setInteractPermission", {
        "roomId": "AAAAA",
        "playerId": player_id,
        "state": True,
        "target": {
            "type": "item",
            "name": "test item",
            "img": "test img url"
        }
    })

    events = socket.get_received()

    assert events[0]["name"] == "itemData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "isInteracting": True,
            "target": {
                "type": "item",
                "name": "test item",
                "img": "test img url"
            }
        }
    

def test_websocket_event_set_interact_permission_empty(socket: SocketIOTestClient, rooms: RoomData):
    """Tests if the server emits a playerData event to
    everyone connected after setInteractPermission event
    """

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient6"
    })
    player_id = list(socket.get_received()[0]["args"][0].keys())[0]

    socket.emit("setInteractPermission", {
        "roomId": "AAAAA",
        "playerId": player_id,
        "state": False,
        "target": None
    })

    events = socket.get_received()

    assert events[0]["name"] == "itemData" \
        and \
        list(events[0]["args"][0].values())[0] == {
            "isInteracting": False,
            "target": None
        }
