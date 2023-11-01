# Socketio Events

## join

**client -> server**

- Sent whenever a player wants to join an existing room
- Will not generate an event if the room does not exist

```json
{
    "roomId": "AAAAA",
    "username": "testClient"
}
```


## leave

**client -> server**

- Sent whenever a player leaves the room which is connected to
- Will not generate an event if the room does not exist

```json
{
    "roomId": "AAAAA"
}
```


## playerData

**server -> client**

- Sent as a response to:
    - `join`

```json
{
    *socket_id*: {
        "username": "testClient",
        "isReady": False
    }
}
```
