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

    assert list(socket.get_received()[0]["args"][0].values())[0] == {
        "username": "testClient",
        "isReady": False
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

