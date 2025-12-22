"""
Schemas for version management.
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from app.api.schemas.validators import validate_optional_uuid


class VersionBase(BaseModel):
    """Base fields for version schemas."""
    version_label: Optional[str] = Field(None, max_length=100, description="Human-readable version label")
    commit_message: Optional[str] = Field(None, max_length=500, description="Commit message describing changes")
    change_type: str = Field(default="minor", max_length=20, description="Type of change (major, minor, patch)")
    is_active: bool = Field(default=False, description="Whether this version is currently active")


class VersionCreateRequest(VersionBase):
    """Request schema for creating a new version."""
    bpmn_json: Dict[str, Any] = Field(..., description="BPMN JSON content")
    parent_version_id: Optional[str] = Field(None, description="Parent version ID (UUID)")
    generation_method: str = Field(default="manual_edit", max_length=50, description="Method used to generate this version")
    source_artifact_ids: Optional[List[str]] = Field(None, description="Source artifact IDs (UUIDs)")
    
    @field_validator('parent_version_id')
    @classmethod
    def validate_parent_version_id(cls, v):
        return validate_optional_uuid(v)
    
    @field_validator('source_artifact_ids')
    @classmethod
    def validate_source_artifact_ids(cls, v):
        if v is None:
            return None
        from app.api.schemas.validators import validate_uuid
        return [validate_uuid(id) for id in v]


class VersionResponse(VersionBase):
    """Response schema for version."""
    id: str = Field(..., description="Version ID (UUID)")
    process_id: str = Field(..., description="Process ID (UUID)")
    version_number: int = Field(..., ge=1, description="Version number")
    created_at: datetime = Field(..., description="Creation timestamp")
    created_by: Optional[str] = Field(None, max_length=255, description="User who created the version")
    parent_version_id: Optional[str] = Field(None, description="Parent version ID (UUID)")
    etag: Optional[str] = Field(None, max_length=64, description="ETag for optimistic locking")
    
    model_config = ConfigDict(from_attributes=True)


class VersionHistoryItem(BaseModel):
    """Item in version history."""
    id: str
    version_number: int
    version_label: Optional[str]
    commit_message: Optional[str]
    created_at: datetime
    created_by: Optional[str]
    is_active: bool
    change_type: Optional[str]
    parent_version_id: Optional[str]
    etag: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)


class RestoreVersionRequest(BaseModel):
    """Request to restore a version."""
    version_id: str = Field(..., description="Version ID to restore (UUID)")
    commit_message: Optional[str] = Field(None, max_length=500, description="Optional commit message for the restore")
    
    @field_validator('version_id')
    @classmethod
    def validate_version_id(cls, v):
        from app.api.schemas.validators import validate_uuid
        return validate_uuid(v)


# Backward compatibility aliases
ModelVersionBase = VersionBase
ModelVersionCreate = VersionCreateRequest
ModelVersionResponse = VersionResponse

__all__ = [
    "VersionBase",
    "VersionCreateRequest",
    "VersionResponse",
    "VersionHistoryItem",
    "RestoreVersionRequest",
    # Backward compatibility
    "ModelVersionBase",
    "ModelVersionCreate",
    "ModelVersionResponse",
]

