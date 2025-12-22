"""
Process endpoints for ProcessLab API

Thin HTTP layer that delegates to use cases.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Header
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.db.session import get_db
from app.core.exceptions import ResourceNotFoundError
from app.api.schemas.versions import VersionCreateRequest, VersionResponse, VersionHistoryItem, ModelVersionCreate, ModelVersionResponse, RestoreVersionRequest
from app.api.schemas.processes import ProcessResponse
from app.api.schemas.spaces import ProcessMoveRequest
from app.application.processes.get_process import GetProcessUseCase
from app.application.processes.list_processes import ListProcessesUseCase
from app.application.processes.delete_process import DeleteProcessUseCase
from app.application.processes.update_process import UpdateProcessUseCase, UpdateProcessCommand
from app.application.versioning.create_version import CreateVersionUseCase, CreateVersionCommand
from app.application.versioning.list_versions import ListVersionsUseCase
from app.application.versioning.get_version import GetVersionUseCase
from app.application.versioning.activate_version import ActivateVersionUseCase
from app.application.versioning.restore_version import RestoreVersionUseCase
from app.core.dependencies import (
    get_get_process_use_case,
    get_list_processes_use_case,
    get_delete_process_use_case,
    get_update_process_use_case,
    get_create_version_use_case,
    get_list_versions_use_case,
    get_get_version_use_case,
    get_activate_version_use_case,
    get_restore_version_use_case,
    get_version_repository,
    get_process_repository
)
from app.domain.repositories.version_repository import VersionRepository
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _entity_to_response(process, version_count: int = 0) -> ProcessResponse:
    """Convert domain entity to response model"""
    return ProcessResponse(
        id=process.id,
        name=process.name,
        description=process.description,
        folder_id=process.folder_id,
        user_id="local-user",  # Fixed for local-first
        created_at=process.created_at,
        updated_at=process.updated_at,
        version_count=version_count,
        status="ready"
    )


@router.get("/processes", response_model=List[ProcessResponse])
def list_processes_catalog(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    db: Session = Depends(get_db)
):
    """Search/List processes in the private space."""
    use_case = get_list_processes_use_case(db)
    version_repo = get_version_repository(db)
    
    processes = use_case.execute(folder_id=None, search=search)
    
    # Get version counts
    results = []
    for process in processes:
        version_count = version_repo.count_by_process_id(process.id)
        results.append(_entity_to_response(process, version_count))
    
    return results


@router.get("/processes/{process_id}", response_model=ProcessResponse)
def get_process(
    process_id: str,
    db: Session = Depends(get_db)
):
    """Get details of a specific process."""
    use_case = get_get_process_use_case(db)
    version_repo = get_version_repository(db)
    process = use_case.execute(process_id)
    version_count = version_repo.count_by_process_id(process_id)
    return _entity_to_response(process, version_count)


@router.post("/processes/{process_id}/versions", response_model=ModelVersionResponse)
def create_version(
    process_id: str,
    version_data: ModelVersionCreate,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    db: Session = Depends(get_db)
):
    """Create a new version for a process."""
    use_case = get_create_version_use_case(db)
    version_repo = get_version_repository(db)
    
    # Optimistic locking check
    if if_match:
        last_version = version_repo.find_latest(process_id)
        if last_version and last_version.etag and if_match != last_version.etag:
            from app.api.schemas.governance import ConflictError
            conflict_payload = ConflictError(
                message="Process changed since you started editing.",
                your_etag=if_match,
                current_etag=last_version.etag,
                last_modified_by=last_version.created_by,
                last_modified_at=last_version.created_at
            ).model_dump()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=conflict_payload)
    
    # Create command
    command = CreateVersionCommand(
        process_id=process_id,
        bpmn_json=version_data.bpmn_json,
        version_label=version_data.version_label,
        commit_message=version_data.commit_message,
        change_type=version_data.change_type,
        parent_version_id=version_data.parent_version_id,
        generation_method=version_data.generation_method,
        source_artifact_ids=version_data.source_artifact_ids,
        generation_prompt=None,  # TODO: Add to schema
        is_active=version_data.is_active if hasattr(version_data, 'is_active') else False
    )
    
    # Execute use case
    version = use_case.execute(command)
    
    # Convert to response
    return ModelVersionResponse.model_validate(version)


@router.get("/processes/{process_id}/versions", response_model=Dict[str, Any])
def list_process_versions(
    process_id: str,
    db: Session = Depends(get_db)
):
    """List all versions of a process (History)."""
    use_case = get_list_versions_use_case(db)
    return use_case.execute(process_id)


@router.get("/processes/{process_id}/versions/{version_id}")
def get_version(
    process_id: str,
    version_id: str,
    db: Session = Depends(get_db)
):
    """Get a specific version with its BPMN content."""
    use_case = get_get_version_use_case(db)
    return use_case.execute(process_id, version_id)


@router.put("/processes/{process_id}/versions/{version_id}/activate")
def activate_version(
    process_id: str,
    version_id: str,
    db: Session = Depends(get_db)
):
    """Activate a specific version of a process."""
    use_case = get_activate_version_use_case(db)
    return use_case.execute(process_id, version_id)


@router.post("/processes/{process_id}/versions/{version_id}/restore", response_model=ModelVersionResponse)
def restore_version(
    process_id: str,
    version_id: str,
    request: RestoreVersionRequest,
    db: Session = Depends(get_db)
):
    """Restore a process to a previous version."""
    use_case = get_restore_version_use_case(db)
    restored_version = use_case.execute(process_id, version_id, request.commit_message)
    return ModelVersionResponse.model_validate(restored_version)


@router.put("/processes/{process_id}/move", response_model=ProcessResponse)
def move_process(
    process_id: str,
    payload: ProcessMoveRequest,
    db: Session = Depends(get_db)
):
    """Move a process to another folder."""
    use_case = get_update_process_use_case(db)
    version_repo = get_version_repository(db)
    
    command = UpdateProcessCommand(
        process_id=process_id,
        folder_id=payload.folder_id,
        position=payload.position
    )
    
    process = use_case.execute(command)
    version_count = version_repo.count_by_process_id(process_id)
    return _entity_to_response(process, version_count)


@router.delete("/processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_process(
    process_id: str,
    db: Session = Depends(get_db)
):
    """Soft delete a process."""
    use_case = get_delete_process_use_case(db)
    use_case.execute(process_id)
    return None