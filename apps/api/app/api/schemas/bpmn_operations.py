"""
Schemas for BPMN operations: Generate, Edit, Export.

These schemas are used by the BPMN manipulation endpoints.
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from app.api.schemas.common import BPMNJSON
from app.api.schemas.validators import validate_optional_uuid


# ============================================================================
# Generate Schemas
# ============================================================================

class GenerateRequest(BaseModel):
    """Request schema for BPMN generation."""
    artifact_ids: List[str] = Field(..., min_items=1, description="List of artifact IDs (UUIDs) to use as context")
    process_name: str = Field(default="Untitled Process", min_length=1, max_length=255, description="Name for the generated process")
    project_id: Optional[str] = Field(None, description="Project ID (UUID)")
    folder_id: Optional[str] = Field(None, description="Folder ID (UUID, optional)")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Generation options")
    
    @field_validator('artifact_ids')
    @classmethod
    def validate_artifact_ids(cls, v):
        from app.api.schemas.validators import validate_uuid
        return [validate_uuid(id) for id in v]
    
    @field_validator('project_id', 'folder_id')
    @classmethod
    def validate_optional_ids(cls, v):
        return validate_optional_uuid(v)


class GenerateResponse(BaseModel):
    """Response schema for BPMN generation."""
    bpmn_json: Dict[str, Any] = Field(..., description="Generated BPMN in JSON format")
    preview_xml: str = Field(..., description="Generated BPMN in XML format (for preview)")
    process_id: Optional[str] = Field(None, description="Created process ID (if project_id was provided)")
    model_version_id: str = Field(..., description="Model version ID")
    metrics: Dict[str, Any] = Field(..., description="Generation metrics")


# ============================================================================
# Edit Schemas
# ============================================================================

class EditRequest(BaseModel):
    """Request to edit BPMN using natural language."""
    bpmn: Optional[BPMNJSON] = Field(None, description="Current BPMN state (JSON)")
    bpmn_xml: Optional[str] = Field(None, max_length=1000000, description="Current BPMN state (XML)")
    model_version_id: Optional[str] = Field(None, description="ID of the version being edited (UUID)")
    command: str = Field(..., min_length=1, max_length=5000, description="Natural language editing command")
    if_match: Optional[str] = Field(None, alias="ifMatch", max_length=64, description="ETag for optimistic locking")
    user_api_key: Optional[str] = Field(None, alias="userApiKey", max_length=500, description="User's LLM API key (BYOK pattern)")
    
    @field_validator('model_version_id')
    @classmethod
    def validate_model_version_id(cls, v):
        return validate_optional_uuid(v)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "bpmn_xml": "<?xml ...>",
                "command": "Add a user task called 'Review Document' after the start event"
            }
        }


class EditResponse(BaseModel):
    """Response with edited BPMN."""
    bpmn: BPMNJSON = Field(..., description="Updated BPMN in JSON format")
    version_id: str = Field(..., alias="versionId", description="New version ID")
    changes: List[str] = Field(
        default_factory=list,
        description="Human-readable list of changes made"
    )

    class Config:
        populate_by_name = True


# ============================================================================
# Export Schemas
# ============================================================================

class ExportRequest(BaseModel):
    """Request to export BPMN to different formats."""
    bpmn: BPMNJSON = Field(..., description="BPMN to export")
    format: Literal["xml", "png", "json"] = Field(..., description="Export format")
    options: Optional[Dict[str, Any]] = Field(
        None,
        description="Format-specific options (e.g., image resolution)"
    )


class ExportResponse(BaseModel):
    """Response with exported content."""
    format: str
    content: str = Field(..., description="Base64 encoded content for binary formats")
    filename: str = Field(..., description="Suggested filename")
    mime_type: str = Field(..., alias="mimeType", description="MIME type")

    class Config:
        populate_by_name = True


# ============================================================================
# Ingestion Schemas
# ============================================================================

class IngestResponse(BaseModel):
    """Response from file upload."""
    artifact_id: str = Field(..., alias="artifactId", description="Unique ID for the uploaded artifact")
    filename: str
    file_size: int = Field(..., alias="fileSize", description="File size in bytes")
    mime_type: str = Field(..., alias="mimeType", description="MIME type")
    status: Literal["uploaded", "processing", "failed"] = "uploaded"
    message: Optional[str] = None

    class Config:
        populate_by_name = True


__all__ = [
    "GenerateRequest",
    "GenerateResponse",
    "EditRequest",
    "EditResponse",
    "ExportRequest",
    "ExportResponse",
    "IngestResponse",
]

