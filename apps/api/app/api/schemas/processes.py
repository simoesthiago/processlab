"""
Schemas for Process management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ProcessResponse(BaseModel):
    """Process response model."""
    id: str = Field(..., description="Process ID (UUID)")
    name: str = Field(..., min_length=1, max_length=255, description="Process name")
    description: Optional[str] = Field(None, max_length=1000, description="Process description")
    folder_id: Optional[str] = Field(None, description="Parent folder ID (UUID)")
    user_id: Optional[str] = Field(None, description="User ID")
    current_version_id: Optional[str] = Field(None, description="Current active version ID (UUID)")
    created_by: Optional[str] = Field(None, description="User who created the process")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    version_count: int = Field(default=0, ge=0, description="Number of versions")
    status: str = Field(default="draft", description="Process status")
    
    model_config = ConfigDict(from_attributes=True)

__all__ = ["ProcessResponse"]

