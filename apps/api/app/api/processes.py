"""Schemas for Process management."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ProcessResponse(BaseModel):
    """Process response model."""
    id: str
    name: str
    description: Optional[str] = None
    folder_id: Optional[str] = None
    user_id: Optional[str] = None
    current_version_id: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    version_count: int = 0
    status: str = "draft"
    
    model_config = ConfigDict(from_attributes=True)
