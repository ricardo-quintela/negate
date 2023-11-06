import socketio

import logging

from flask import Flask, render_template, redirect, request, abort, Response
from flask_socketio import SocketIO, join_room as sio_join_room, leave_room as sio_leave_room

"""
Ficheiro uma beca desnecessario, msm só para estudar sockets e isso
"""
sio = socketio.Client()

def join_room(username, room_id):
    sio.emit("join", {
        "roomId": room_id,
        "username": username
    })
    
    
def leave_room(room_id):
    sio.emit("leave", {
        "roomId": room_id
    })

def create_room(username):
    sio.emit("create-room", {
        "username": username
    })

def set_ready(room_id, is_ready=True):
    sio.emit("ready", {
        "roomId": room_id,
        "isReady": is_ready
    })

def lock_in_character(room_id, character):
    sio.emit("lockIn", {
        "roomId": room_id,
        "character": character
    })


if __name__ == "__main__":
    # Testes 
    username = input("Enter your username: ")
    room_id = input("Enter the room code (if joining a room): ")

    sio.connect("http://127.0.0.1:5000/")  # URL of the flask sv

    if room_id:
        join_room(username, room_id)
    else:
        create_room(username)

    while True:
        action = input("Choose an action (1: Leave Room,  2: Quit): ")

        if action == "1":
            if room_id:
                leave_room(room_id)
            else:
                print("Not in a room.")
        elif action == "2":
            break
