"""
Process endpoints for ProcessLab API

Handles process management: Metadata, Versioning, Move, Delete.
Creation is handled via Spaces API.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import User, ProcessModel, ModelVersion, Folder
from app.core.dependencies import get_current_user
from app.schemas.auth import ProcessResponse
from app.schemas.governance import ConflictError
from app.core.exceptions import ResourceNotFoundError, AuthorizationError, ValidationError
from app.schemas.versioning import ModelVersionCreate, ModelVersionResponse, VersionHistoryItem
from datetime import datetime
import hashlib
import json
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def compute_etag(payload: Dict[str, Any]) -> str:
    """
    Generate a deterministic hash for optimistic locking.
    """
    serialized = json.dumps(payload or {}, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def _get_process_or_404(db: Session, process_id: str, user_id: str) -> ProcessModel:
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    if process.user_id != user_id:
        raise AuthorizationError("Access denied to this process")
        
    return process


@router.get("/processes", response_model=List[ProcessResponse])
def list_processes_catalog(
    status: Optional[str] = Query(None, description="Filter by status: draft, active, archived"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Search/List processes in the user's private space.
    """
    # Use aliases to join ModelVersion twice (once for count, once for active version)
    VersionCount = aliased(ModelVersion)
    ActiveVersion = aliased(ModelVersion)
    
    # Build base query with version count and active version info
    query = db.query(
        ProcessModel,
        func.count(VersionCount.id).label('version_count'),
        ActiveVersion.status.label('active_version_status')
    ).outerjoin(
        VersionCount,
        VersionCount.process_id == ProcessModel.id
    ).outerjoin(
        ActiveVersion,
        (ActiveVersion.id == ProcessModel.current_version_id)
    ).filter(
        ProcessModel.user_id == current_user.id,
        ProcessModel.deleted_at == None
    )
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ProcessModel.name.ilike(search_term),
                ProcessModel.description.ilike(search_term)
            )
        )
    
    # Group by process and active version status
    query = query.group_by(ProcessModel.id, ActiveVersion.status)
    
    results = query.all()
    
    # Build response with status derivation
    processes = []
    for process, version_count, active_version_status in results:
        derived_status = active_version_status if active_version_status else "draft"
        if status and derived_status != status:
            continue
        
        process_dict = ProcessResponse.from_orm(process).dict()
        process_dict['version_count'] = version_count or 0
        process_dict['status'] = derived_status
        processes.append(ProcessResponse(**process_dict))
    
    return processes


@router.get("/processes/{process_id}", response_model=ProcessResponse)
def get_process(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get details of a specific process."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    # Get version count
    version_count = db.query(func.count(ModelVersion.id)).filter(
        ModelVersion.process_id == process_id
    ).scalar()
    
    process_dict = ProcessResponse.from_orm(process).dict()
    process_dict['version_count'] = version_count
    
    return ProcessResponse(**process_dict)


@router.post("/processes/{process_id}/versions", response_model=ModelVersionResponse)
def create_version(
    process_id: str,
    version_data: ModelVersionCreate,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new version for a process."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    # Get next version number
    last_version = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).first()
    
    next_version_number = (last_version.version_number + 1) if last_version else 1

    # Optimistic locking
    if if_match and last_version and last_version.etag and if_match != last_version.etag:
        conflict_payload = ConflictError(
            message="Process changed since you started editing.",
            your_etag=if_match,
            current_etag=last_version.etag,
            last_modified_by=last_version.created_by,
            last_modified_at=last_version.created_at
        ).model_dump()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_payload)
    
    # Validate parent version if provided
    if version_data.parent_version_id:
        parent = db.query(ModelVersion).filter(
            ModelVersion.id == version_data.parent_version_id,
            ModelVersion.process_id == process_id
        ).first()
        if not parent:
            raise ResourceNotFoundError("Parent Version", version_data.parent_version_id)
    
    new_version = ModelVersion(
        process_id=process_id,
        version_number=next_version_number,
        version_label=version_data.version_label or f"v{next_version_number}",
        commit_message=version_data.commit_message,
        change_type=version_data.change_type,
        parent_version_id=version_data.parent_version_id,
        bpmn_json=version_data.bpmn_json,
        generation_method=version_data.generation_method,
        source_artifact_ids=version_data.source_artifact_ids,
        created_by=current_user.id,
        etag=compute_etag(version_data.bpmn_json),
        status="ready",
        is_active=False
    )
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    # Auto-activate first version or if requested
    if version_data.is_active or next_version_number == 1:
        process.current_version_id = new_version.id
        new_version.is_active = True
        db.commit()
    
    logger.info(f"Created version {new_version.version_number} for process {process_id}")
    return new_version


@router.get("/processes/{process_id}/versions", response_model=Dict[str, Any])
def list_process_versions(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all versions of a process (History)."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    versions = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).all()
    
    history_items = []
    for v in versions:
        item = VersionHistoryItem.from_orm(v)
        item.is_active = (v.id == process.current_version_id)
        history_items.append(item)
    
    return {
        "process_id": process_id,
        "process_name": process.name,
        "versions": history_items,
        "total_count": len(history_items)
    }


@router.get("/processes/{process_id}/versions/{version_id}")
def get_version(
    process_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific version with its BPMN content."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not version:
        raise ResourceNotFoundError("Version", version_id)
    
    xml_content = version.bpmn_json.get('xml', '') if version.bpmn_json else ''
    
    return {
        "id": version.id,
        "version_number": version.version_number,
        "version_label": version.version_label,
        "commit_message": version.commit_message,
        "created_at": version.created_at,
        "created_by": version.created_by,
        "change_type": version.change_type,
        "is_active": (version.id == process.current_version_id),
        "etag": version.etag,
        "xml": xml_content,
        "bpmn_json": version.bpmn_json
    }


@router.put("/processes/{process_id}/versions/{version_id}/activate")
def activate_version(
    process_id: str,
    version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Activate a specific version of a process."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not version:
        raise ResourceNotFoundError("Version", version_id)
    
    process.current_version_id = version_id
    db.commit()
    
    return {
        "message": "Version activated successfully",
        "process_id": process_id,
        "version_id": version_id,
        "version_number": version.version_number
    }


class RestoreVersionRequest(BaseModel):
    commit_message: Optional[str] = None


@router.post("/processes/{process_id}/versions/{version_id}/restore", response_model=ModelVersionResponse)
def restore_version(
    process_id: str,
    version_id: str,
    request: RestoreVersionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a process to a previous version."""
    process = _get_process_or_404(db, process_id, current_user.id)
    
    source_version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not source_version:
        raise ResourceNotFoundError("Version", version_id)
    
    last_version = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).first()
    
    next_version_number = (last_version.version_number + 1) if last_version else 1
    
    restored_version = ModelVersion(
        process_id=process_id,
        version_number=next_version_number,
        version_label=f"v{next_version_number}",
        commit_message=request.commit_message or f"Restored to version {source_version.version_number}",
        change_type="major",
        parent_version_id=process.current_version_id,
        bpmn_json=dict(source_version.bpmn_json) if source_version.bpmn_json else {},
        generation_method="restored",
        source_artifact_ids=source_version.source_artifact_ids,
        created_by=current_user.id,
        etag=compute_etag(source_version.bpmn_json or {}),
        status="ready",
        is_active=True
    )
    
    db.add(restored_version)
    db.flush()
    process.current_version_id = restored_version.id
    db.commit()
    db.refresh(restored_version)
    
    return restored_version


class ProcessMoveRequest(BaseModel):
    folder_id: Optional[str] = None
    position: Optional[int] = None


@router.put("/processes/{process_id}/move", response_model=ProcessResponse)
def move_process(
    process_id: str,
    payload: ProcessMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move a process to another folder."""
    process = _get_process_or_404(db, process_id, current_user.id)

    # Validate folder
    if payload.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == payload.folder_id,
            Folder.deleted_at == None
        ).first()
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)
        if folder.user_id != current_user.id:
            raise ValidationError("Folder must belong to you")
        process.folder_id = folder.id
    else:
        # Move to root of private space
        process.folder_id = None

    if payload.position is not None:
        process.position = payload.position

    db.commit()
    db.refresh(process)
    return ProcessResponse.from_orm(process)


@router.delete("/processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_process(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft delete a process."""
    process = _get_process_or_404(db, process_id, current_user.id)
    process.deleted_at = datetime.utcnow()
    db.commit()
    return None