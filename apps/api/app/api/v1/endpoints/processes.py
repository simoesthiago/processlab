"""
Process endpoints for ProcessLab API

Handles process management within projects.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.db.session import get_db
from app.db.models import User, ProcessModel, ModelVersion
from app.core.dependencies import get_current_user, require_organization_access, require_role
from app.schemas.auth import ProcessResponse
from app.core.exceptions import ResourceNotFoundError, AuthorizationError
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


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
    
    # Check access to first process (they all have same org)
    if results:
        first_process = results[0][0]
        require_organization_access(current_user, first_process.organization_id)
    
    # Build response
    processes = []
    for process, version_count in results:
        process_dict = ProcessResponse.from_orm(process).dict()
        process_dict['version_count'] = version_count
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
    require_organization_access(current_user, process.organization_id)
    
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
    require_organization_access(current_user, process.organization_id)
    require_role(current_user, ["editor", "admin"])
    
    # Get next version number
    last_version = db.query(ModelVersion).filter(
        ModelVersion.process_id == process_id
    ).order_by(ModelVersion.version_number.desc()).first()
    
    next_version_number = (last_version.version_number + 1) if last_version else 1
    
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
    require_organization_access(current_user, process.organization_id)
    
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
    require_organization_access(current_user, process.organization_id)
    require_role(current_user, ["editor", "admin"])
    
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
    require_organization_access(current_user, process.organization_id)
    
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
