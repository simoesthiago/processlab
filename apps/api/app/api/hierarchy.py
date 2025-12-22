"""Schemas for folder and hierarchy management."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, ConfigDict

from app.api.processes import ProcessResponse


class FolderBase(BaseModel):
    """Common fields for folder creation/update."""

    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[str] = Field(
        None, description="Parent folder (null for root-level folder)"
    )
    color: Optional[str] = Field(None, description="Optional UI color token")
    icon: Optional[str] = Field(None, description="Optional UI icon")
    position: Optional[int] = Field(
        None, description="Explicit ordering position inside the parent"
    )


class FolderCreate(FolderBase):
    """Request schema for creating a folder inside a project."""

    pass


class FolderUpdate(BaseModel):
    """Request schema for updating or moving a folder."""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    parent_folder_id: Optional[str] = Field(
        None, description="Parent folder (null to move to root)"
    )
    color: Optional[str] = None
    icon: Optional[str] = None
    position: Optional[int] = None


class FolderResponse(BaseModel):
    """Response schema for folder metadata."""

    id: str
    user_id: Optional[str] = None
    parent_folder_id: Optional[str] = None
    name: str
    description: Optional[str]
    color: Optional[str]
    icon: Optional[str]
    position: int
    created_at: datetime
    updated_at: datetime
    process_count: Optional[int] = Field(
        None, description="How many processes are directly inside this folder"
    )
    child_count: Optional[int] = Field(
        None, description="How many direct child folders this folder has"
    )

    model_config = ConfigDict(from_attributes=True)


class FolderTree(FolderResponse):
    """Folder with nested children and contained processes."""

    children: List["FolderTree"] = Field(default_factory=list)
    processes: List[ProcessResponse] = Field(default_factory=list)

# ProjectHierarchyResponse completely removed as Projects are gone



# Resolve forward references for recursive models
FolderTree.model_rebuild()


class FolderItem(BaseModel):
    """Minimal folder info for path."""
    id: str
    name: str


class FolderPathResponse(BaseModel):
    """Response for folder path."""
    path: List[FolderItem]


