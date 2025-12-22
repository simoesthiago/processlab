"""
Common validators for API schemas.
"""

import re
from typing import Any
from pydantic import field_validator

# UUID v4 pattern
UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    re.IGNORECASE
)


def validate_uuid(value: Any) -> str:
    """
    Validate that a string is a valid UUID v4.
    
    Args:
        value: The value to validate
        
    Returns:
        The validated UUID string
        
    Raises:
        ValueError: If the value is not a valid UUID
    """
    if not isinstance(value, str):
        raise ValueError("ID must be a string")
    
    if not UUID_PATTERN.match(value):
        raise ValueError("ID must be a valid UUID v4 format")
    
    return value


def validate_optional_uuid(value: Any) -> str | None:
    """
    Validate that a string is a valid UUID v4, or None.
    
    Args:
        value: The value to validate (can be None)
        
    Returns:
        The validated UUID string or None
        
    Raises:
        ValueError: If the value is not None and not a valid UUID
    """
    if value is None:
        return None
    return validate_uuid(value)

