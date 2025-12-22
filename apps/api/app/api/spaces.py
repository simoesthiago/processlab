"""Schemas for Space (private/team) navigation and recents."""

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from app.api.processes import ProcessResponse
from app.api.hierarchy import FolderTree


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

# SpaceCreate removed as we don't create new spaces anymore (only default private)



class SpaceDetailResponse(SpaceSummary):
    """Detailed response for a space."""

    created_at: datetime


class SpaceProcessCreate(BaseModel):
    """Create a process directly under a space (optionally inside a folder)."""

    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None


class SpaceProcessUpdate(BaseModel):
    """Update a process within a space."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    folder_id: Optional[str] = Field(None, description="Move to folder (null to move to root)")


class FolderMoveRequest(BaseModel):
    """Request to move a folder to a new parent."""

    parent_folder_id: Optional[str] = Field(None, description="New parent folder ID (null to move to root)")


class ProcessMoveRequest(BaseModel):
    """Request to move a process to a new folder."""

    folder_id: Optional[str] = Field(None, description="New folder ID (null to move to root)")


class FolderPathItem(BaseModel):
    """Single item in folder path."""

    id: str
    name: str


class FolderPathResponse(BaseModel):
    """Response with full path to a folder."""

    folder_id: str
    folder_name: str
    path: List[FolderPathItem] = Field(default_factory=list, description="Path from root to folder")


class SpaceStatsResponse(BaseModel):
    """Statistics for a space."""

    space_id: str
    total_folders: int
    total_processes: int
    root_folders: int
    root_processes: int

