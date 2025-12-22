"""
Model Version Domain Entity

Pure business entity representing a process version.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional, Dict, Any, List


@dataclass
class ModelVersion:
    """Model version domain entity"""
    
    id: str
    process_id: str
    version_number: int
    version_label: Optional[str]
    commit_message: Optional[str]
    change_type: str  # major, minor, patch
    parent_version_id: Optional[str]
    bpmn_json: Dict[str, Any]
    generation_method: str  # ai_generated, manual_edit, restored
    source_artifact_ids: Optional[List[str]]
    generation_prompt: Optional[str]
    status: str  # draft, ready
    is_active: bool
    etag: Optional[str]
    quality_score: Optional[int]
    created_at: datetime
    created_by: str
    
    @classmethod
    def create(
        cls,
        process_id: str,
        version_number: int,
        bpmn_json: Dict[str, Any],
        generation_method: str = "manual_edit",
        version_label: Optional[str] = None,
        commit_message: Optional[str] = None,
        change_type: str = "minor",
        parent_version_id: Optional[str] = None,
        source_artifact_ids: Optional[List[str]] = None,
        generation_prompt: Optional[str] = None,
        is_active: bool = False
    ) -> "ModelVersion":
        """Factory method to create a new version"""
        import hashlib
        import json
        
        # Compute etag
        serialized = json.dumps(bpmn_json or {}, sort_keys=True, separators=(",", ":"))
        etag = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        
        if not version_label:
            version_label = f"v{version_number}"
        
        return cls(
            id="",  # Will be set by repository
            process_id=process_id,
            version_number=version_number,
            version_label=version_label,
            commit_message=commit_message,
            change_type=change_type,
            parent_version_id=parent_version_id,
            bpmn_json=bpmn_json,
            generation_method=generation_method,
            source_artifact_ids=source_artifact_ids or [],
            generation_prompt=generation_prompt,
            status="ready",
            is_active=is_active,
            etag=etag,
            quality_score=None,
            created_at=datetime.utcnow(),
            created_by="local-user"
        )
    
    def activate(self) -> None:
        """Mark version as active"""
        self.is_active = True
    
    def deactivate(self) -> None:
        """Mark version as inactive"""
        self.is_active = False

