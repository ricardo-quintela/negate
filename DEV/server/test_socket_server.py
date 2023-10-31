# pylint: skip-file
"""Tests the rest server
"""
import pytest
from flask import Flask
from flask.testing import FlaskClient
from flask_socketio import SocketIO
from flask_socketio.test_client import SocketIOTestClient
from server import app, socket_server

@pytest.fixture
def rest_api():
    app.config.update(
        {"TESTING": True}
    )
    yield app

@pytest.fixture
def client(rest_api: Flask) -> FlaskClient:
    return rest_api.test_client()



@pytest.fixture
def websocket() -> SocketIO:
    yield socket_server

@pytest.fixture
def socket(websocket: SocketIO, rest_api: Flask) -> SocketIOTestClient:
    return websocket.test_client(rest_api)





def test_websocket_connected(socket: SocketIOTestClient):
    """Test if the connection is established
    """
    assert socket.is_connected() is True


def test_websocket_event_join(socket: SocketIOTestClient, client: FlaskClient):
    """Tests if the server emits a join event to everyone connected
    """

    client.post(
        "/testing/create-room",
        data={
            "roomId": "AAAAA"
        }
    )

    socket.emit("join", {
        "roomId": "AAAAA",
        "username": "testClient"
    })

    assert list(socket.get_received()[0]["args"][0].values())[0] == {
        "username": "testClient",
        "isReady": False
    }
