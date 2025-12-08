"""
Process endpoints for ProcessLab API

Handles process management within projects.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, or_
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.db.models import User, ProcessModel, ModelVersion, Project, Folder
from app.core.dependencies import get_current_user, require_organization_access, require_role
from app.schemas.auth import ProcessResponse
from app.schemas.governance import ConflictError
from app.core.exceptions import ResourceNotFoundError, AuthorizationError, ValidationError
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


class ProcessCreate(BaseModel):
    name: str
    description: Optional[str] = None
    project_id: str
    folder_id: Optional[str] = None


@router.get("/projects/{project_id}/processes", response_model=List[ProcessResponse])
def list_processes_in_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all processes in a project.
    
    Requires user to have access to the project's organization.
    """
    # Validate project and access
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()

    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    if project.organization_id:
        require_organization_access(current_user, project.organization_id)
    else:
        if not current_user.is_superuser and project.owner_id != current_user.id:
            raise AuthorizationError("Access denied to this personal project")

    # Fetch processes with version count
    query = db.query(
        ProcessModel,
        func.count(ModelVersion.id).label('version_count')
    ).outerjoin(
        ModelVersion,
        ModelVersion.process_id == ProcessModel.id
    ).filter(
        ProcessModel.project_id == project_id,
        ProcessModel.deleted_at == None
    ).group_by(ProcessModel.id)
    
    results = query.all()
    
    # Build response
    processes = []
    for process, version_count in results:
        process_dict = ProcessResponse.from_orm(process).dict()
        process_dict['version_count'] = version_count
        processes.append(ProcessResponse(**process_dict))
    
    return processes


@router.post("/processes", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
def create_process(
    payload: ProcessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new process under a project (and optional folder).
    """
    project = db.query(Project).filter(
        Project.id == payload.project_id,
        Project.deleted_at == None
    ).first()

    if not project:
        raise ResourceNotFoundError("Project", payload.project_id)

    # Access control
    if project.organization_id:
        require_organization_access(current_user, project.organization_id)
        require_role(current_user, ["editor", "admin"])
    else:
        # Personal project: only owner or superuser
        if project.owner_id != current_user.id and not current_user.is_superuser:
            raise AuthorizationError("Access denied to create process in this project")

    # Optional folder check
    if payload.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == payload.folder_id,
            Folder.project_id == payload.project_id,
            Folder.deleted_at == None
        ).first()
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)

    process = ProcessModel(
        project_id=payload.project_id,
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description,
        organization_id=project.organization_id,
        user_id=project.owner_id if not project.organization_id else None,
        created_by=current_user.id,
    )

    db.add(process)
    db.commit()
    db.refresh(process)

    return ProcessResponse.model_validate(process)


@router.get("/processes", response_model=List[ProcessResponse])
def list_processes_catalog(
    status: Optional[str] = Query(None, description="Filter by status: draft, active, archived"),
    owner: Optional[str] = Query(None, description="Filter by owner (created_by user ID)"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Catalog endpoint: List all processes in user's organization with advanced filters.
    
    - status: Filter by process status (derived from active version status)
    - owner: Filter by process owner (created_by)
    - project_id: Filter by project
    - search: Search in process name and description
    """
    # Determine organization
    if not current_user.organization_id:
        return []
    
    # Check access
    require_organization_access(current_user, current_user.organization_id)
    
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
        ProcessModel.organization_id == current_user.organization_id,
        ProcessModel.deleted_at == None
    )
    
    # Apply filters
    if project_id:
        query = query.filter(ProcessModel.project_id == project_id)
    
    if owner:
        query = query.filter(ProcessModel.created_by == owner)
    
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
        # Derive status from active version
        # If no active version, status is "draft"
        # If active version exists, use its status
        derived_status = active_version_status if active_version_status else "draft"
        
        # Apply status filter if provided
        if status and derived_status != status:
            continue
        
        process_dict = ProcessResponse.from_orm(process).dict()
        process_dict['version_count'] = version_count or 0
        process_dict['status'] = derived_status  # Add status to response
        processes.append(ProcessResponse(**process_dict))
    
    return processes


@router.get("/processes/{process_id}", response_model=ProcessResponse)
def get_process(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific process.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
    elif process.user_id:
        # Private process (no organization)
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        # Legacy personal process tied to a project
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Get version count
    version_count = db.query(func.count(ModelVersion.id)).filter(
        ModelVersion.process_id == process_id
    ).scalar()
    
    process_dict = ProcessResponse.from_orm(process).dict()
    process_dict['version_count'] = version_count
    
    return ProcessResponse(**process_dict)


from app.schemas.versioning import ModelVersionCreate, ModelVersionResponse, VersionHistoryItem

@router.post("/processes/{process_id}/versions", response_model=ModelVersionResponse)
def create_version(
    process_id: str,
    version_data: ModelVersionCreate,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new version for a process.
    
    Increments version number automatically.
    Links to parent version if provided.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
        require_role(current_user, ["editor", "admin"])
    elif process.user_id:
        # Personal/private process
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        # Legacy personal project relationship
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Get next version number
    last_version = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).first()
    
    next_version_number = (last_version.version_number + 1) if last_version else 1

    # Optimistic locking using If-Match header against latest stored etag
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
    
    # Create new version
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
        is_active=False # Explicitly set to False, must be activated separately
    )
    
    db.add(new_version)
    db.commit()
    db.refresh(new_version)
    
    # If requested to be active or it's the first version, activate it
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
    """
    List all versions of a process (History).
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Fetch versions
    versions = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).all()
    
    # Convert to response items
    history_items = []
    for v in versions:
        item = VersionHistoryItem.from_orm(v)
        # Manually set is_active based on process current_version_id
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
    """
    Get a specific version with its BPMN content.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Fetch version
    version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not version:
        raise ResourceNotFoundError("Version", version_id)
    
    # Extract XML from bpmn_json
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
    """
    Activate a specific version of a process.
    
    Sets the version as the current_version_id for the process.
    Requires editor or admin role.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
        require_role(current_user, ["editor", "admin"])
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Check version exists and belongs to this process
    version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not version:
        raise ResourceNotFoundError("Version", version_id)
    
    # Activate version
    process.current_version_id = version_id
    db.commit()
    
    logger.info(f"Activated version {version.version_number} for process {process.name} (id: {process_id})")
    
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
    """
    Restore a process to a previous version.
    
    Creates a new version with the content of the specified version.
    This preserves history while restoring the process state.
    Requires editor or admin role.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
        require_role(current_user, ["editor", "admin"])
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Fetch version to restore
    source_version = db.query(ModelVersion).filter(
        ModelVersion.id == version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not source_version:
        raise ResourceNotFoundError("Version", version_id)
    
    # Get current active version to use as parent
    current_active_version_id = process.current_version_id
    
    # Get next version number
    last_version = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).first()
    
    next_version_number = (last_version.version_number + 1) if last_version else 1
    
    # Create new version with content from source version
    restored_version = ModelVersion(
        process_id=process_id,
        version_number=next_version_number,
        version_label=f"v{next_version_number}",
        commit_message=request.commit_message or f"Restored to version {source_version.version_number}",
        change_type="major",  # Restore is always a major change
        parent_version_id=current_active_version_id,  # Link to current version
        bpmn_json=dict(source_version.bpmn_json) if source_version.bpmn_json else {},  # Copy content (deep copy for dict)
        generation_method="restored",
        source_artifact_ids=source_version.source_artifact_ids,  # Preserve source artifacts
        created_by=current_user.id,
        etag=compute_etag(source_version.bpmn_json or {}),
        status="ready",
        is_active=True  # Auto-activate restored version
    )
    
    db.add(restored_version)
    db.flush()
    
    # Activate the restored version
    process.current_version_id = restored_version.id
    
    db.commit()
    db.refresh(restored_version)
    
    logger.info(f"Restored process {process_id} to version {source_version.version_number} (new version: {restored_version.version_number})")
    
    return restored_version


from app.schemas.versioning import VersionDiffResponse
import difflib

@router.get("/processes/{process_id}/versions/diff", response_model=VersionDiffResponse)
def get_version_diff(
    process_id: str,
    base_version_id: str,
    compare_version_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compare two versions of a process.
    
    Returns a summary of changes (added/removed lines/elements).
    Currently performs a text-based diff on the XML content.
    """
    # Fetch process
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    # Check access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    
    # Fetch versions
    base_version = db.query(ModelVersion).filter(
        ModelVersion.id == base_version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    compare_version = db.query(ModelVersion).filter(
        ModelVersion.id == compare_version_id,
        ModelVersion.process_id == process_id
    ).first()
    
    if not base_version:
        raise ResourceNotFoundError("Base Version", base_version_id)
    if not compare_version:
        raise ResourceNotFoundError("Compare Version", compare_version_id)
        
    # Extract content (assuming bpmn_json has 'xml' key based on our frontend implementation)
    # If not, fallback to empty string
    base_content = base_version.bpmn_json.get('xml', '') if base_version.bpmn_json else ''
    compare_content = compare_version.bpmn_json.get('xml', '') if compare_version.bpmn_json else ''
    
    # Perform basic diff
    # In a real implementation, we would parse BPMN XML and compare elements structurally.
    # For now, we'll do a line-based diff to detect changes.
    
    diff = difflib.unified_diff(
        base_content.splitlines(),
        compare_content.splitlines(),
        fromfile=f'v{base_version.version_number}',
        tofile=f'v{compare_version.version_number}',
        lineterm=''
    )
    
    changes = []
    added = []
    removed = []
    
    for line in diff:
        if line.startswith('+') and not line.startswith('+++'):
            clean_line = line[1:].strip()
            if clean_line:
                added.append(clean_line[:100]) # Truncate for summary
        elif line.startswith('-') and not line.startswith('---'):
            clean_line = line[1:].strip()
            if clean_line:
                removed.append(clean_line[:100])
                
    if added:
        changes.append(f"Added {len(added)} lines/elements")
    if removed:
        changes.append(f"Removed {len(removed)} lines/elements")
    if not changes:
        changes.append("No changes detected (or identical content)")

    return VersionDiffResponse(
        base_version_id=base_version_id,
        compare_version_id=compare_version_id,
        changes=changes,
        added_elements=added[:5], # Limit for summary
        removed_elements=removed[:5],
        modified_elements=[]
    )


class ProcessMoveRequest(BaseModel):
    """Request payload to move a process between folders/projects."""

    project_id: Optional[str] = None
    folder_id: Optional[str] = None
    position: Optional[int] = None


@router.put("/processes/{process_id}/move", response_model=ProcessResponse)
def move_process(
    process_id: str,
    payload: ProcessMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Move a process to another folder or project.

    - Validates workspace permissions
    - Ensures folder belongs to the target project
    - Updates optional ordering position
    """
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None  # noqa: E711
    ).first()

    if not process:
        raise ResourceNotFoundError("Process", process_id)

    # Verify current access
    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")
    require_role(current_user, ["editor", "admin"])

    target_project = process.project

    # If switching projects, validate target
    if payload.project_id and payload.project_id != process.project_id:
        target_project = db.query(Project).filter(
            Project.id == payload.project_id,
            Project.deleted_at == None  # noqa: E711
        ).first()
        if not target_project:
            raise ResourceNotFoundError("Project", payload.project_id)

        # Access rules
        if target_project.organization_id:
            require_organization_access(current_user, target_project.organization_id)
        else:
            if not current_user.is_superuser and target_project.owner_id != current_user.id:
                raise AuthorizationError("Access denied to the target project")

        process.project_id = target_project.id
        process.organization_id = target_project.organization_id
        process.user_id = target_project.owner_id if not target_project.organization_id else None

    # Validate folder (optional)
    if payload.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == payload.folder_id,
            Folder.deleted_at == None  # noqa: E711
        ).first()
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)
        if folder.project_id != process.project_id:
            raise ValidationError("Folder must belong to the same project as the process")
        process.folder_id = folder.id
    else:
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
    """
    Soft delete a process and its versions remain for auditing.
    """
    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None  # noqa: E711
    ).first()

    if not process:
        raise ResourceNotFoundError("Process", process_id)

    if process.organization_id:
        require_organization_access(current_user, process.organization_id)
        require_role(current_user, ["editor", "admin"])
    elif process.user_id:
        if not current_user.is_superuser and process.user_id != current_user.id:
            raise AuthorizationError("Access denied to this personal process")
    else:
        if (
            process.project
            and not current_user.is_superuser
            and process.project.owner_id != current_user.id
        ):
            raise AuthorizationError("Access denied to this personal project")

    process.deleted_at = datetime.utcnow()
    db.commit()
    return None