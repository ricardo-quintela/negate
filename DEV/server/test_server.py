# pylint: skip-file
"""Tests the rest server
"""
import pytest
from flask import Flask
from flask.testing import FlaskClient

from server import app, room_data
from rooms import RoomData

@pytest.fixture
def rooms():
    room_data.create_room("AAAAA")
    return room_data

#*===========================================================

@pytest.fixture
def rest_api():
    app.config.update(
        {"TESTING": True}
    )
    yield app

@pytest.fixture
def client(rest_api: Flask) -> FlaskClient:
    return rest_api.test_client()

#*===========================================================


def test_home_route(client: FlaskClient):
    """Tests if home route can be accessed
    """
    response = client.get("/")

    assert response.status_code == 200


def test_create_room_route(client: FlaskClient):
    """Tests if create-room route can be accessed
    """

    response = client.get("/create-room?username=testClient")

    assert response.status_code == 303


def test_create_room_route_bad_req(client: FlaskClient):
    """Tests if create-room route with bad query params is not accessed
    """
    response = client.get("/create-room")

    assert response.status_code == 400


def test_join_room_route(client: FlaskClient, rooms: RoomData):
    """Tests if join-room route can be accessed
    """
    response = client.get("/join-room?roomId=AAAAA&username=testClient")

    assert response.status_code == 303


def test_join_room_route_bad_req(client: FlaskClient, rooms: RoomData):
    """Tests if join-room route can be accessed
    """
    response = client.get("/join-room")

    assert response.status_code == 400


def test_game_route(client: FlaskClient, rooms: RoomData):
    """Tests if an existing room can be accessed route can be accessed
    """

    response = client.get("/game/AAAAA?username=testClient")

    assert response.status_code == 200





#* ==========================================================


def test_testing_create_room(client: FlaskClient):
    """Tests if the testing endpoint can create a room
    """
    response = client.get(
        "/testing/create-room?roomId=AAAAA"
    )

    assert response.json == {
        "roomId": "AAAAA",
        "roomData": {
            "playerCount": 0,
            "players": dict()
        }
    }


def test_testing_delete_room(client: FlaskClient):
    """Tests if the testing endpoint can delete a room
    """
    response = client.delete(
        "/testing/delete-room?roomId=AAAAA"
    )

    assert response.json == {
        "roomId": "AAAAA",
        "roomData": {
            "playerCount": 0,
            "players": dict()
        }
    }

def test_testing_delete_room_unexistent(client: FlaskClient):
    """Tests if the deleting room testing endpoint returns None if a room
    doesn't exist
    """
    response = client.delete(
        "/testing/delete-room?roomId=BBBBB"
    )

    assert response.json == {
        "roomId": "BBBBB",
        "roomData": None
    }

