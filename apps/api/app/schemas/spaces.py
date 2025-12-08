"""Schemas for Space (private/team) navigation and recents."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.schemas.auth import ProcessResponse
from app.schemas.hierarchy import FolderTree


class SpaceTreeResponse(BaseModel):
    """Tree response for either private or team space roots."""

    space_type: Literal["private", "team"]
    space_id: Optional[str] = Field(
        None, description="Organization ID for team or user ID for private"
    )
    root_folders: List[FolderTree] = Field(default_factory=list)
    root_processes: List[ProcessResponse] = Field(default_factory=list)


class RecentItem(BaseModel):
    """Recent item for activity/log surfaces."""

    id: str
    type: Literal["process", "folder"]
    name: str
    space_type: Literal["private", "team"]
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
    type: Literal["private", "team"]
    role: Literal["admin", "editor", "viewer", "owner"] = "viewer"
    is_protected: bool = False


class SpaceListResponse(BaseModel):
    """List of spaces available to the current user."""

    spaces: List[SpaceSummary]


class SpaceCreate(BaseModel):
    """Create a new team space (backed by organization)."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class SpaceDetailResponse(SpaceSummary):
    """Detailed response for a space."""

    created_at: datetime


class SpaceProcessCreate(BaseModel):
    """Create a process directly under a space (optionally inside a folder)."""

    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None

