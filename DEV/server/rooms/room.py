"""A generator for new room Ids and a room data storage
"""
from random import randint
from typing import TypedDict, Dict, List, Union

# configure rooms
ROOM_ID_LEN = 5

class PlayerInfo(TypedDict):
    """Annotates information about a Player
    """
    username: str
    isReady: bool

class RoomInfo(TypedDict):
    """Annotates information about how the room info
    """
    playerCount: int
    players: Dict[str, PlayerInfo]
    ready: List[str]


class RoomData:
    """Stores information about a room

    Can create new rooms and generate room ids
    """
    def __init__(self) -> None:
        # allocating a dictionary to save the room's info
        self._rooms: Dict[str, RoomInfo] = dict()

    def __contains__(self, item) -> bool:
        return item in self._rooms


    def get(self, room_id: str) -> Union[RoomInfo, None]:
        """Returns the information about a room

        Args:
            room_id (str): the room's id

        Returns:
            Union[RoomInfo, None]: the RoomInfo object or `None` if the room does not exist
        """
        return self._rooms[room_id] if room_id in self._rooms else None

    def delete(self, room_id: str) -> Union[RoomInfo, None]:
        """Deletes an existing room

        Args:
            room_id (str): the id of the room to delete

        Returns:
            Union[RoomInfo, None]: the RoomInfo object or `None` if the room does not exist
        """
        if room_id not in self._rooms:
            return None

        return self._rooms.pop(room_id)


    def get_player_count(self, room_id: str) -> Union[int, None]:
        """Returns the number of connected players

        Args:
            room_id (str): the room's id

        Returns:
            Union[int, None]: the number of connected players
            to that room or None if the room does not exist
        """
        return self._rooms[room_id]["playerCount"] if room_id in self._rooms else None

    def get_players(self, room_id: str) -> Union[Dict[str, PlayerInfo], None]:
        """Returns the connected players info

        Args:
            room_id (str): the room's id

        Returns:
            Union[Dict[str, PlayerInfo], None]: the connected players info
            of the given room or None if the room does not exist
        """
        return self._rooms[room_id]["players"] if room_id in self._rooms else None


    def add_player(self, room_id: str, player_id: str, username: str) -> bool:
        """Adds a new player to the room

        Args:
            room_id (str): the room's id
            player_id (str): the player's id
            username (str): the player's username

        Returns: True if the player was added, False if the room does not exist
        """
        if room_id not in self._rooms:
            return False

        self._rooms[room_id]["players"][player_id] = {
            "username": username,
            "isReady": False
        }
        self._rooms[room_id]["playerCount"] += 1
        return True

    def remove_player(self, room_id: str, player_id: str) -> bool:
        """Removes a player from the room

        Args:
            player_id (str): the player's id
            username (str): the player's username

        Returns: True if the player was removed, False if the room does not exist
        """
        if room_id not in self._rooms:
            return False

        self._rooms[room_id]["players"].pop(player_id)
        self._rooms[room_id]["playerCount"] -= 1
        return True


    def generate_id(self):
        """Generates a valid and unique room id

        Returns:
            str: an unique room id
        
        Examples:
            ```
            >>> room_data
            'RoomData(rooms: 0)'
            >>> room_data.generate_id()
            'ABCDE'
            ```
        """
        room_id = ""

        while True:
            for _ in range(ROOM_ID_LEN):
                ascii_code = randint(ord("A"), ord("Z"))
                room_id += chr(ascii_code)

            if room_id not in self._rooms:
                break

            room_id = ""

        return room_id


    def create_room(self, room_id: str = None) -> str:
        """Adds a new room in memory

        If a roomId is given the created room will adopt that identifier

        Args:
            roomId (str, optional): The id of the room to create. Defaults to `None`.

        Returns:
            str: the created room id
        """

        if room_id is None:
            ascii_id = self.generate_id()
        else:
            ascii_id = room_id

        self._rooms[ascii_id] = dict(
            playerCount = 0,
            players = dict()
        )

        return ascii_id

    def __repr__(self) -> str:
        return f"RoomData('rooms': {len(self._rooms)})"
