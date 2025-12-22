from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class ModelVersionBase(BaseModel):
    version_label: Optional[str] = None
    commit_message: Optional[str] = None
    change_type: str = "minor"
    is_active: bool = False

class ModelVersionCreate(ModelVersionBase):
    bpmn_json: Dict[str, Any]
    parent_version_id: Optional[str] = None
    generation_method: str = "manual_edit"
    source_artifact_ids: Optional[List[str]] = None

class ModelVersionResponse(ModelVersionBase):
    id: str
    process_id: str
    version_number: int
    created_at: datetime
    created_by: Optional[str] = None
    parent_version_id: Optional[str] = None
    etag: Optional[str] = None
    
    class Config:
        from_attributes = True

class VersionHistoryItem(BaseModel):
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
    
    class Config:
        from_attributes = True

