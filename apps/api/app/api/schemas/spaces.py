"""
Schemas for Space (private/team) navigation and recents.
"""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field, field_validator
from app.api.schemas.processes import ProcessResponse
from app.api.schemas.folders import FolderTree
from app.api.schemas.validators import validate_optional_uuid


class SpaceTreeResponse(BaseModel):
    """Tree response for private space root."""

    space_type: Literal["private"] = "private"
    space_id: Optional[str] = Field(
        None, description="User ID for private space"
    )
    root_folders: List[FolderTree] = Field(default_factory=list)
    root_processes: List[ProcessResponse] = Field(default_factory=list)


class RecentItem(BaseModel):
    """Recent item for activity/log surfaces."""

    id: str
    type: Literal["process", "folder"]
    name: str
    space_type: Literal["private"] = "private"
    space_id: Optional[str] = None
    parent_folder_id: Optional[str] = None
    updated_at: datetime


class RecentsResponse(BaseModel):
    """Wrapper for recent items list."""

    items: List[RecentItem]


class SpaceSummary(BaseModel):
    """Minimal space info for navigation."""

    id: str
    name: str
    description: Optional[str] = None
    type: Literal["private"] = "private"
    role: Literal["owner"] = "owner"
    is_protected: bool = False


class SpaceListResponse(BaseModel):
    """List of spaces available to the current user."""

    spaces: List[SpaceSummary]


class SpaceDetailResponse(SpaceSummary):
    """Detailed response for a space."""

    created_at: datetime


class SpaceProcessCreateRequest(BaseModel):
    """Create a process directly under a space (optionally inside a folder)."""

    name: str = Field(..., min_length=1, max_length=255, description="Process name")
    description: Optional[str] = Field(None, max_length=1000, description="Process description")
    folder_id: Optional[str] = Field(None, description="Parent folder ID (UUID)")
    
    @field_validator('folder_id')
    @classmethod
    def validate_folder_id(cls, v):
        from app.api.schemas.validators import validate_optional_uuid
        return validate_optional_uuid(v)


class SpaceProcessUpdateRequest(BaseModel):
    """Update a process within a space."""

    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Process name")
    description: Optional[str] = Field(None, max_length=1000, description="Process description")
    folder_id: Optional[str] = Field(None, description="Parent folder ID (UUID, null to move to root)")
    
    @field_validator('folder_id')
    @classmethod
    def validate_folder_id(cls, v):
        return validate_optional_uuid(v)


class FolderMoveRequest(BaseModel):
    """Request to move a folder to a new parent."""

    parent_folder_id: Optional[str] = Field(None, description="New parent folder ID (UUID, null to move to root)")
    
    @field_validator('parent_folder_id')
    @classmethod
    def validate_parent_folder_id(cls, v):
        return validate_optional_uuid(v)


class ProcessMoveRequest(BaseModel):
    """Request to move a process to a new folder."""

    folder_id: Optional[str] = Field(None, description="New folder ID (UUID, null to move to root)")
    
    @field_validator('folder_id')
    @classmethod
    def validate_folder_id(cls, v):
        return validate_optional_uuid(v)


class SpaceStatsResponse(BaseModel):
    """Statistics for a space."""

    space_id: str
    total_folders: int
    total_processes: int
    root_folders: int
    root_processes: int


# Backward compatibility aliases
SpaceProcessCreate = SpaceProcessCreateRequest
SpaceProcessUpdate = SpaceProcessUpdateRequest

__all__ = [
    "SpaceTreeResponse",
    "RecentItem",
    "RecentsResponse",
    "SpaceSummary",
    "SpaceListResponse",
    "SpaceDetailResponse",
    "SpaceProcessCreateRequest",
    "SpaceProcessUpdateRequest",
    "FolderMoveRequest",
    "ProcessMoveRequest",
    "SpaceStatsResponse",
    # Backward compatibility
    "SpaceProcessCreate",
    "SpaceProcessUpdate",
]

