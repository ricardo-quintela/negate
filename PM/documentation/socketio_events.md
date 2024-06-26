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
        "username": username,
        "isReady": false,
        "character": -1,
        "position": [0,0],
        "facing": "right",
        "isMoving": false,
        "isInteracting": false
    }
}
```

## lockIn

**client -> server**

```json
{
    "roomId": "AAAAA",
    "character": 0
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

## movePlayer

**client -> server**

- `key` -> `"up"`, `"down"`, `"left"`, `"right"`
The dpad key that was pressed

- `state` -> `true` for key down and `false` for key up

```json
{
    "roomId": "AAAAA",
    "key": "up",
    "state": true
}
```


## setInteractionPermission

**client -> server**

Fired whenever a player is near something they can interact

```json
{
    "roomId": "AAAAA",
    "playerId": "jaoiwd89awd_dawuj",
    "state": true,
    "target": {
            "type": "item" | "document",
            "name": "target's name",
            "content" | "img": "document content" | "img url"
        }
}
```

## itemData

**server -> client**

- Sent as a response to:
    - `setInteractionPermission`

```json
{
    *socket_id*: {
        "isInteracting": true,
        "target": {
            "type": "item" | "document",
            "name": "target's name",
            "content" | "img": "document content" | "img url"
        }
    }
}
```

## sendItem

**client -> server**

- Sent whenever a player wants to send an item to other player

```json
{
    "roomId": "AAAAA",
    "item": {
        "type": "item" | "document",
        "name": "target's name",
        "content" | "img": "document content" | "img url"
    },
    "itemIndex": 1,
    "receiverId": *receiver_id*
}
```


## playerSend

**server -> client**

- Sent as a response to:
    - `sendItem`

```json
{
    "item": {
        "type": "item" | "document",
        "name": "target's name",
        "content" | "img": "document content" | "img url"
    },
    "receiverId": *receiver_id*,
    "itemIndex": 1,
    "senderId" : *socket_id*
}
```
