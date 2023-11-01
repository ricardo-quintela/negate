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

## ready

**client -> server**

- Sent whenever a player sets their ready state
- Will not generate an event if the room does not exist

```json
{
    "roomId": "AAAAA",
    "isReady": True
}
```


## playerData

**server -> client**

- Sent as a response to:
    - `join`
    - `leave`
    - `ready`

```json
{
    *socket_id*: {
        "username": "testClient",
        "isReady": False,
        "character": 0
    }
}
```

## characterData

**server -> client**

- Sent as a response to:
    - `lockIn`

```json
{
    *socket_id*: {
        "character": 0
    }
}
```
