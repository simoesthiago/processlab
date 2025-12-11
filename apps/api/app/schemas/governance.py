"""
Pydantic schemas for governance endpoints (optimistic locking)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# =============================================================================
# Optimistic Locking Schemas
# =============================================================================

class ConflictError(BaseModel):
    """Response schema for edit conflict (409)"""
    error: str = "Edit conflict detected"
    message: str
    your_etag: str
    current_etag: str
    last_modified_by: Optional[str] = None
    last_modified_at: Optional[datetime] = None
    options: List[str] = ["overwrite", "save_as_copy"]
