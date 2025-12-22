"""
Folder endpoints.

Thin HTTP layer that delegates to use cases.
"""

from fastapi import APIRouter, Depends, status
from app.core.dependencies import (
    get_update_folder_use_case,
    get_delete_folder_use_case,
    get_get_folder_use_case,
    get_process_repository,
    get_folder_repository
)
from app.application.folders.update_folder import UpdateFolderUseCase, UpdateFolderCommand
from app.application.folders.delete_folder import DeleteFolderUseCase
from app.api.hierarchy import FolderResponse, FolderUpdate

router = APIRouter()


def _entity_to_response(folder, process_count: int = 0, child_count: int = 0) -> FolderResponse:
    """Convert domain entity to response model"""
    response = FolderResponse(
        id=folder.id,
        user_id="local-user",
        parent_folder_id=folder.parent_folder_id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        icon=folder.icon,
        position=folder.position,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        process_count=process_count,
        child_count=child_count
    )
    return response


@router.patch("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    use_case: UpdateFolderUseCase = Depends(get_update_folder_use_case),
    process_repo = Depends(get_process_repository),
    folder_repo = Depends(get_folder_repository)
):
    """Rename, recolor, or move a folder."""
    command = UpdateFolderCommand(
        folder_id=folder_id,
        name=folder_data.name,
        description=folder_data.description,
        parent_folder_id=folder_data.parent_folder_id,
        position=folder_data.position,
        color=folder_data.color,
        icon=folder_data.icon
    )
    
    folder = use_case.execute(command)
    
    # Get counts
    processes = process_repo.find_all(folder_id=folder.id)
    children = folder_repo.find_all(parent_folder_id=folder.id)
    
    return _entity_to_response(folder, len(processes), len(children))


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    use_case: DeleteFolderUseCase = Depends(get_delete_folder_use_case)
):
    """Soft-delete a folder and everything inside it."""
    use_case.execute(folder_id)
    return None
