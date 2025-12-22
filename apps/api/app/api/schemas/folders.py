"""
Schemas for folder and hierarchy management.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.api.schemas.processes import ProcessResponse
from app.api.schemas.validators import validate_optional_uuid


class FolderBase(BaseModel):
    """Common fields for folder creation/update."""

    name: str = Field(..., min_length=1, max_length=255, description="Folder name")
    description: Optional[str] = Field(None, max_length=1000, description="Folder description")
    parent_folder_id: Optional[str] = Field(
        None, description="Parent folder ID (UUID, null for root-level folder)"
    )
    color: Optional[str] = Field(None, max_length=50, description="Optional UI color token")
    icon: Optional[str] = Field(None, max_length=50, description="Optional UI icon")
    position: Optional[int] = Field(
        None, ge=0, description="Explicit ordering position inside the parent"
    )
    
    @field_validator('parent_folder_id')
    @classmethod
    def validate_parent_folder_id(cls, v):
        return validate_optional_uuid(v)


class FolderCreateRequest(FolderBase):
    """Request schema for creating a folder inside a project."""
    pass


class FolderUpdateRequest(BaseModel):
    """Request schema for updating or moving a folder."""

    name: Optional[str] = Field(None, min_length=1, max_length=255, description="Folder name")
    description: Optional[str] = Field(None, max_length=1000, description="Folder description")
    parent_folder_id: Optional[str] = Field(
        None, description="Parent folder ID (UUID, null to move to root)"
    )
    color: Optional[str] = Field(None, max_length=50, description="UI color token")
    icon: Optional[str] = Field(None, max_length=50, description="UI icon")
    position: Optional[int] = Field(None, ge=0, description="Ordering position")
    
    @field_validator('parent_folder_id')
    @classmethod
    def validate_parent_folder_id(cls, v):
        return validate_optional_uuid(v)


class FolderResponse(BaseModel):
    """Response schema for folder metadata."""

    id: str = Field(..., description="Folder ID (UUID)")
    user_id: Optional[str] = Field(None, description="User ID")
    parent_folder_id: Optional[str] = Field(None, description="Parent folder ID (UUID)")
    name: str = Field(..., min_length=1, max_length=255, description="Folder name")
    description: Optional[str] = Field(None, max_length=1000, description="Folder description")
    color: Optional[str] = Field(None, max_length=50, description="UI color token")
    icon: Optional[str] = Field(None, max_length=50, description="UI icon")
    position: int = Field(..., ge=0, description="Ordering position")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    process_count: Optional[int] = Field(
        None, ge=0, description="How many processes are directly inside this folder"
    )
    child_count: Optional[int] = Field(
        None, ge=0, description="How many direct child folders this folder has"
    )

    model_config = ConfigDict(from_attributes=True)


class FolderTree(FolderResponse):
    """Folder with nested children and contained processes."""

    children: List["FolderTree"] = Field(default_factory=list)
    processes: List[ProcessResponse] = Field(default_factory=list)


# Resolve forward references for recursive models
FolderTree.model_rebuild()


class FolderItem(BaseModel):
    """Minimal folder info for path."""
    id: str
    name: str


class FolderPathItem(BaseModel):
    """Single item in folder path."""
    id: str
    name: str
    parent_folder_id: Optional[str] = None


class FolderPathResponse(BaseModel):
    """Response for folder path."""
    folder_id: str
    folder_name: str
    path: List[FolderPathItem] = Field(default_factory=list, description="Path from root to folder")


# Backward compatibility aliases
FolderCreate = FolderCreateRequest
FolderUpdate = FolderUpdateRequest

__all__ = [
    "FolderBase",
    "FolderCreateRequest",
    "FolderUpdateRequest",
    "FolderResponse",
    "FolderTree",
    "FolderItem",
    "FolderPathItem",
    "FolderPathResponse",
    # Backward compatibility
    "FolderCreate",
    "FolderUpdate",
]

