"""Contains tools to validate JSON
"""
from typing import Dict, Union

# json response annotation
JSONDictionary = Dict[str, Union[str, int, float, bool]]

class ValidateJson:
    """Contains methods to validate JSON
    """

    @staticmethod
    def validate_keys(json: JSONDictionary, *keys) -> bool:
        """Checks if the dictionary contains the given keys

        Args:
            json (JSONDictionary): the json formated dictionary
            keys (str): the keys to validate

        Returns:
            bool: True if the dictionary contains all the keys; False otherwise
        """
        for key in keys:
            if key not in json:
                return False
        return True
