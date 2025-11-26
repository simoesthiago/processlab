"""
API Request/Response Schemas

These models extend the base BPMN_JSON schema with API-specific request/response structures.
"""

import sys
from pathlib import Path

# Find the monorepo root (contains packages/ directory)
current_file = Path(__file__).resolve()
monorepo_root = current_file.parent
while monorepo_root.name != 'processlab' and monorepo_root.parent != monorepo_root:
    monorepo_root = monorepo_root.parent

# Add shared-schemas to path
shared_schemas_path = monorepo_root / "packages" / "shared-schemas" / "src"
if shared_schemas_path.exists() and str(shared_schemas_path) not in sys.path:
    sys.path.insert(0, str(shared_schemas_path))

try:
    # Import shared BPMN models
    from models import BPMNJSON, BPMNElement, SequenceFlow, Lane, ProcessInfo
except ImportError:
    # Fallback: create stub models if shared schema not available
    from pydantic import BaseModel
    class BPMNJSON(BaseModel):
        pass
    class BPMNElement(BaseModel):
        pass
    class SequenceFlow(BaseModel):
        pass
    class Lane(BaseModel):
        pass
    class ProcessInfo(BaseModel):
        pass

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


# Re-export shared models
__all__ = [
    "BPMNJSON",
    "BPMNElement", 
    "SequenceFlow",
    "Lane",
    "ProcessInfo",
    "IngestRequest",
    "IngestResponse",
    "GenerateRequest",
    "GenerateResponse",
    "EditRequest",
    "EditResponse",
    "ExportRequest",
    "ExportResponse",
]


# Ingest Endpoint Models
class IngestResponse(BaseModel):
    """Response from file upload"""
    artifactId: str = Field(..., description="Unique ID for the uploaded artifact")
    filename: str
    fileSize: int = Field(..., description="File size in bytes")
    mimeType: str
    status: Literal["uploaded", "processing", "failed"] = "uploaded"
    message: Optional[str] = None


# Generate Endpoint Models
class GenerateRequest(BaseModel):
    """Request to generate BPMN from artifacts"""
    artifactIds: List[str] = Field(..., description="List of artifact IDs to process")
    prompt: Optional[str] = Field(None, description="Optional user guidance for generation")
    userApiKey: Optional[str] = Field(
        None,
        description="User's LLM API key (BYOK pattern - never logged or persisted)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "artifactIds": ["artifact_123", "artifact_456"],
                "prompt": "Focus on the approval workflow in section 3"
            }
        }


class GenerateResponse(BaseModel):
    """Response with generated BPMN"""
    bpmn: BPMNJSON = Field(..., description="Generated BPMN in JSON format")
    versionId: str = Field(..., description="Version ID for tracking")
    metadata: Optional[dict] = Field(
        None,
        description="Additional metadata (processing time, model used, etc.)"
    )


# Edit Endpoint Models
class EditRequest(BaseModel):
    """Request to edit BPMN using natural language"""
    bpmn: BPMNJSON = Field(..., description="Current BPMN state")
    command: str = Field(..., description="Natural language editing command")
    userApiKey: Optional[str] = Field(
        None,
        description="User's LLM API key (BYOK pattern - never logged or persisted)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "bpmn": {"process": {"id": "proc1"}, "elements": [], "flows": []},
                "command": "Add a user task called 'Review Document' after the start event"
            }
        }


class EditResponse(BaseModel):
    """Response with edited BPMN"""
    bpmn: BPMNJSON = Field(..., description="Updated BPMN in JSON format")
    versionId: str = Field(..., description="New version ID")
    changes: List[str] = Field(
        default_factory=list,
        description="Human-readable list of changes made"
    )


# Export Endpoint Models
class ExportRequest(BaseModel):
    """Request to export BPMN to different formats"""
    bpmn: BPMNJSON = Field(..., description="BPMN to export")
    format: Literal["xml", "png", "json"] = Field(..., description="Export format")
    options: Optional[dict] = Field(
        None,
        description="Format-specific options (e.g., image resolution)"
    )


class ExportResponse(BaseModel):
    """Response with exported content"""
    format: str
    content: str = Field(..., description="Base64 encoded content for binary formats")
    filename: str = Field(..., description="Suggested filename")
    mimeType: str
