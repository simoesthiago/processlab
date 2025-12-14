"""
Folder endpoints.

Provides Update/Delete for folders. 
Creation is handled via Spaces API to ensure correct context.
"""

from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.exceptions import AuthorizationError, ResourceNotFoundError, ValidationError
from app.db.models import Folder, ProcessModel, User
from app.db.session import get_db
from app.schemas.hierarchy import FolderResponse, FolderUpdate

router = APIRouter()


def _get_folder_or_404(db: Session, folder_id: str) -> Folder:
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id, Folder.deleted_at == None)
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)
    return folder


def _validate_no_cycle(db: Session, folder: Folder, new_parent_id: str | None):
    """Ensure we never create circular references when moving folders."""
    if new_parent_id is None:
        return

    if new_parent_id == folder.id:
        raise ValidationError("Folder cannot be its own parent")

    current = _get_folder_or_404(db, new_parent_id)
    while current.parent_folder_id:
        if current.parent_folder_id == folder.id:
            raise ValidationError("Cannot move folder inside its own subtree")
        current = _get_folder_or_404(db, current.parent_folder_id)


@router.patch("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename, recolor, or move a folder."""
    folder = _get_folder_or_404(db, folder_id)
    
    # Access Control: Folder must belong to current user (Private Space)
    if folder.user_id != current_user.id:
        raise AuthorizationError("Access denied to this folder")

    # Handle move/parent change
    if folder_data.parent_folder_id is not None:
        if folder_data.parent_folder_id:
            new_parent = _get_folder_or_404(db, folder_data.parent_folder_id)
            if new_parent.user_id != current_user.id:
                 raise ValidationError("Parent folder must belong to you")
        
        _validate_no_cycle(db, folder, folder_data.parent_folder_id)
        folder.parent_folder_id = folder_data.parent_folder_id

    if folder_data.name is not None:
        folder.name = folder_data.name
    if folder_data.description is not None:
        folder.description = folder_data.description
    if folder_data.color is not None:
        folder.color = folder_data.color
    if folder_data.icon is not None:
        folder.icon = folder_data.icon
    if folder_data.position is not None:
        folder.position = folder_data.position

    db.commit()
    db.refresh(folder)

    # Add counts for convenience
    process_count = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.folder_id == folder.id,
            ProcessModel.deleted_at == None,
        )
        .count()
    )
    child_count = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,
        )
        .count()
    )

    response = FolderResponse.from_orm(folder)
    response.process_count = process_count
    response.child_count = child_count
    return response


@router.delete("/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_folder(
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft-delete a folder and everything inside it."""
    folder = _get_folder_or_404(db, folder_id)

    if folder.user_id != current_user.id:
        raise AuthorizationError("Access denied to this folder")

    now = datetime.utcnow()

    def cascade_delete(target: Folder):
        # Mark folder
        target.deleted_at = now
        # Delete contained processes
        db.query(ProcessModel).filter(
            ProcessModel.folder_id == target.id,
            ProcessModel.deleted_at == None,
        ).update({"deleted_at": now})
        # Recurse into children
        children = db.query(Folder).filter(
            Folder.parent_folder_id == target.id,
            Folder.deleted_at == None,
        )
        for child in children:
            cascade_delete(child)

    cascade_delete(folder)
    db.commit()
    return None



