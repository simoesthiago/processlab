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
from app.api.versioning import ModelVersionCreate, ModelVersionResponse, VersionHistoryItem
from app.api.processes import ProcessResponse
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
    get_version_repository
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
    use_case: ListProcessesUseCase = Depends(get_list_processes_use_case),
    version_repo: VersionRepository = Depends(get_version_repository)
):
    """Search/List processes in the private space."""
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
    use_case: GetProcessUseCase = Depends(get_get_process_use_case),
    version_repo: VersionRepository = Depends(get_version_repository)
):
    """Get details of a specific process."""
    process = use_case.execute(process_id)
    version_count = version_repo.count_by_process_id(process_id)
    return _entity_to_response(process, version_count)


@router.post("/processes/{process_id}/versions", response_model=ModelVersionResponse)
def create_version(
    process_id: str,
    version_data: ModelVersionCreate,
    if_match: Optional[str] = Header(default=None, alias="If-Match"),
    use_case: CreateVersionUseCase = Depends(get_create_version_use_case),
    version_repo: VersionRepository = Depends(get_version_repository)
):
    """Create a new version for a process."""
    # Optimistic locking check
    if if_match:
        last_version = version_repo.find_latest(process_id)
        if last_version and last_version.etag and if_match != last_version.etag:
            from app.api.governance import ConflictError
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
    use_case: ListVersionsUseCase = Depends(get_list_versions_use_case)
):
    """List all versions of a process (History)."""
    return use_case.execute(process_id)


@router.get("/processes/{process_id}/versions/{version_id}")
def get_version(
    process_id: str,
    version_id: str,
    use_case: GetVersionUseCase = Depends(get_get_version_use_case)
):
    """Get a specific version with its BPMN content."""
    return use_case.execute(process_id, version_id)


@router.put("/processes/{process_id}/versions/{version_id}/activate")
def activate_version(
    process_id: str,
    version_id: str,
    use_case: ActivateVersionUseCase = Depends(get_activate_version_use_case)
):
    """Activate a specific version of a process."""
    return use_case.execute(process_id, version_id)


class RestoreVersionRequest(BaseModel):
    commit_message: Optional[str] = None


@router.post("/processes/{process_id}/versions/{version_id}/restore", response_model=ModelVersionResponse)
def restore_version(
    process_id: str,
    version_id: str,
    request: RestoreVersionRequest,
    use_case: RestoreVersionUseCase = Depends(get_restore_version_use_case)
):
    """Restore a process to a previous version."""
    restored_version = use_case.execute(process_id, version_id, request.commit_message)
    return ModelVersionResponse.model_validate(restored_version)


class ProcessMoveRequest(BaseModel):
    folder_id: Optional[str] = None
    position: Optional[int] = None


@router.put("/processes/{process_id}/move", response_model=ProcessResponse)
def move_process(
    process_id: str,
    payload: ProcessMoveRequest,
    use_case: UpdateProcessUseCase = Depends(get_update_process_use_case),
    version_repo: VersionRepository = Depends(get_version_repository)
):
    """Move a process to another folder."""
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
    use_case: DeleteProcessUseCase = Depends(get_delete_process_use_case)
):
    """Soft delete a process."""
    use_case.execute(process_id)
    return None