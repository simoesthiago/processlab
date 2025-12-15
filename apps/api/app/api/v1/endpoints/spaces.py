"""
Spaces endpoints (simplified for Private Space only)

- Private Space tree
- Recents for the current user
"""

from typing import Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_organization_access
from app.core.exceptions import ResourceNotFoundError, ValidationError, AuthorizationError
from app.db.models import Folder, ProcessModel, User
from app.db.session import get_db
from app.schemas.auth import ProcessResponse
from app.schemas.hierarchy import FolderTree, FolderCreate, FolderUpdate
from app.schemas.spaces import (
    RecentsResponse,
    RecentItem,
    SpaceDetailResponse,
    SpaceListResponse,
    SpaceProcessCreate,
    SpaceSummary,
    SpaceTreeResponse,
    FolderMoveRequest,
    SpaceProcessUpdate,
    ProcessMoveRequest,
    FolderPathResponse,
    FolderPathItem,
)

router = APIRouter()


def _build_space_tree(
    folders: List[Folder],
    processes: List[ProcessModel],
    space_id: str,
) -> SpaceTreeResponse:
    """Rebuild a tree from flat folder/process lists for a given space."""
    folder_children: Dict[str | None, List[Folder]] = {}
    for folder in folders:
        folder_children.setdefault(folder.parent_folder_id, []).append(folder)

    process_by_folder: Dict[str | None, List[ProcessModel]] = {}
    for process in processes:
        process_by_folder.setdefault(process.folder_id, []).append(process)

    for key in folder_children:
        folder_children[key] = sorted(
            folder_children[key], key=lambda f: (f.position or 0, f.name.lower())
        )
    for key in process_by_folder:
        process_by_folder[key] = sorted(
            process_by_folder[key], key=lambda p: (p.position or 0, p.name.lower())
        )

    def build_node(folder: Folder) -> FolderTree:
        children = folder_children.get(folder.id, [])
        processes_here = process_by_folder.get(folder.id, [])
        return FolderTree(
            id=folder.id,
            user_id=folder.user_id,
            parent_folder_id=folder.parent_folder_id,
            name=folder.name,
            description=folder.description,
            color=folder.color,
            icon=folder.icon,
            position=folder.position or 0,
            created_at=folder.created_at,
            updated_at=folder.updated_at,
            process_count=len(processes_here),
            child_count=len(children),
            processes=[ProcessResponse.from_orm(p) for p in processes_here],
            children=[build_node(child) for child in children],
        )

    roots = folder_children.get(None, [])

    root_processes = [
        ProcessResponse.from_orm(proc) for proc in process_by_folder.get(None, [])
    ]

    return SpaceTreeResponse(
        space_type="private", space_id=space_id, root_folders=[build_node(f) for f in roots], root_processes=root_processes
    )


@router.get("/spaces/private/tree", response_model=SpaceTreeResponse)
def get_private_space_tree(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return root folders/processes for the user's Private Space."""
    folders = (
        db.query(Folder)
        .filter(
            Folder.user_id == current_user.id,
            Folder.organization_id.is_(None),
            Folder.deleted_at == None
        )
        .all()
    )
    processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.user_id == current_user.id,
            ProcessModel.organization_id.is_(None),
            ProcessModel.deleted_at == None
        )
        .all()
    )
    return _build_space_tree(folders, processes, current_user.id)


@router.get("/spaces", response_model=SpaceListResponse)
def list_spaces(
    current_user: User = Depends(get_current_user),
):
    """List all spaces visible to the current user (only private now)."""
    spaces: List[SpaceSummary] = [
        SpaceSummary(
            id="private",
            name="Private Space",
            description="Your personal space",
            type="private",
            role="owner",
            is_protected=True,
        )
    ]
    return SpaceListResponse(spaces=spaces)


@router.get("/spaces/{space_id}/tree", response_model=SpaceTreeResponse)
def get_space_tree(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generic tree endpoint for any space (only supports 'private')."""
    if space_id != "private":
         raise ResourceNotFoundError("Space", space_id)
         
    return get_private_space_tree(current_user=current_user, db=db)


def _cascade_delete_folder(db: Session, folder: Folder, now: datetime):
    """Soft delete folder, its children and contained processes."""
    folder.deleted_at = now
    db.query(ProcessModel).filter(
        ProcessModel.folder_id == folder.id,
        ProcessModel.deleted_at == None,
    ).update({"deleted_at": now})
    children = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,
        )
        .all()
    )
    for child in children:
        _cascade_delete_folder(db, child, now)


@router.post("/spaces/{space_id}/folders", response_model=FolderTree, status_code=status.HTTP_201_CREATED)
def create_space_folder(
    space_id: str,
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a folder under a space (root or nested)."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    user_id = current_user.id

    if folder_data.parent_folder_id:
        parent = (
            db.query(Folder)
            .filter(
                Folder.id == folder_data.parent_folder_id,
                Folder.deleted_at == None,
            )
            .first()
        )
        if not parent:
            raise ResourceNotFoundError("Folder", folder_data.parent_folder_id)
        if parent.user_id != user_id:
            raise ValidationError("Parent folder must belong to the same space")

    position = (
        folder_data.position
        if folder_data.position is not None
        else db.query(Folder)
        .filter(
            Folder.user_id == user_id,
            Folder.parent_folder_id == folder_data.parent_folder_id,
            Folder.deleted_at == None,
        )
        .count()
    )

    folder = Folder(
        user_id=user_id,
        parent_folder_id=folder_data.parent_folder_id,
        name=folder_data.name,
        description=folder_data.description,
        color=folder_data.color,
        icon=folder_data.icon,
        position=position or 0,
        created_by=current_user.id,
    )

    db.add(folder)
    db.commit()
    db.refresh(folder)

    # Response with counts
    return FolderTree(
        **FolderTree.model_validate(folder).model_dump(),
        process_count=0,
        child_count=0,
        processes=[],
        children=[],
    )


@router.get("/spaces/{space_id}/folders/{folder_id}", response_model=FolderTree)
def get_space_folder(
    space_id: str,
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific folder within a space."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.deleted_at == None,
        )
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    if folder.user_id != current_user.id:
        raise ValidationError("Folder must belong to the private space")

    # Get children and processes
    children = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder_id,
            Folder.deleted_at == None,
        )
        .order_by(Folder.position, Folder.name)
        .all()
    )
    processes_here = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.folder_id == folder_id,
            ProcessModel.deleted_at == None,
        )
        .order_by(ProcessModel.position, ProcessModel.name)
        .all()
    )

    # Build response
    return FolderTree(
        id=folder.id,
        user_id=folder.user_id,
        parent_folder_id=folder.parent_folder_id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        icon=folder.icon,
        position=folder.position or 0,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        process_count=len(processes_here),
        child_count=len(children),
        processes=[ProcessResponse.from_orm(p) for p in processes_here],
        children=[
            FolderTree(
                id=child.id,
                user_id=child.user_id,
                parent_folder_id=child.parent_folder_id,
                name=child.name,
                description=child.description,
                color=child.color,
                icon=child.icon,
                position=child.position or 0,
                created_at=child.created_at,
                updated_at=child.updated_at,
                process_count=0,  # Simplified for nested children
                child_count=0,
                processes=[],
                children=[],
            )
            for child in children
        ],
    )


def _validate_no_cycle_space_folder(db: Session, folder: Folder, new_parent_id: str | None):
    """Ensure we never create circular references when moving folders in spaces."""
    if new_parent_id is None:
        return

    if new_parent_id == folder.id:
        raise ValidationError("Folder cannot be its own parent")

    current = (
        db.query(Folder)
        .filter(Folder.id == new_parent_id, Folder.deleted_at == None)
        .first()
    )
    if not current:
        raise ResourceNotFoundError("Folder", new_parent_id)

    while current.parent_folder_id:
        if current.parent_folder_id == folder.id:
            raise ValidationError("Cannot move folder inside its own subtree")
        current = (
            db.query(Folder)
            .filter(Folder.id == current.parent_folder_id, Folder.deleted_at == None)
            .first()
        )
        if not current:
            break


@router.patch("/spaces/{space_id}/folders/{folder_id}", response_model=FolderTree)
def update_space_folder(
    space_id: str,
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a folder within a space (rename, recolor, move, etc.)."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.deleted_at == None,
        )
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    if folder.user_id != current_user.id:
        raise ValidationError("Folder must belong to the private space")

    # Handle move/parent change
    if folder_data.parent_folder_id is not None:
        if folder_data.parent_folder_id:
            new_parent = (
                db.query(Folder)
                .filter(
                    Folder.id == folder_data.parent_folder_id,
                    Folder.deleted_at == None,
                )
                .first()
            )
            if not new_parent:
                raise ResourceNotFoundError("Folder", folder_data.parent_folder_id)
            if new_parent.user_id != current_user.id:
                raise ValidationError("Parent folder must belong to the same space")
        
        _validate_no_cycle_space_folder(db, folder, folder_data.parent_folder_id)
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

    # Simplified response construction (similar to get_space_folder logic is better but for speed: just basic tree node)
    # Ideally should return full tree or updated node.
    return get_space_folder(space_id, folder_id, current_user, db)


@router.delete("/spaces/{space_id}/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_folder(
    space_id: str,
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a folder within a space with cascade."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.deleted_at == None,
        )
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)
    
    if folder.user_id != current_user.id:
        raise ValidationError("Folder must belong to the private space")

    now = datetime.utcnow()
    _cascade_delete_folder(db, folder, now)
    db.commit()
    return None


@router.post("/spaces/{space_id}/processes", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
def create_space_process(
    space_id: str,
    payload: SpaceProcessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a process directly under a space (root or inside a folder)."""
    if space_id != "private":
         raise ValidationError("Only private space is supported")
    
    if payload.folder_id:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == payload.folder_id,
                Folder.deleted_at == None,
            )
            .first()
        )
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)
        if folder.user_id != current_user.id:
             raise ValidationError("Folder must belong to the same space")
             
    process = ProcessModel(
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description,
        user_id=current_user.id,
        created_by=current_user.id,
    )

    db.add(process)
    db.commit()
    db.refresh(process)

    return ProcessResponse.from_orm(process)


@router.get("/spaces/{space_id}/processes/{process_id}", response_model=ProcessResponse)
def get_space_process(
    space_id: str,
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get details of a specific process within a space."""
    if space_id != "private":
         raise ValidationError("Only private space is supported")

    process = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.id == process_id,
            ProcessModel.deleted_at == None
        )
        .first()
    )
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
        
    if process.user_id != current_user.id:
          raise AuthorizationError("Access denied to this personal process")
          
    # Get version count
    from sqlalchemy import func
    from app.db.models import ModelVersion

    version_count = (
        db.query(func.count(ModelVersion.id))
        .filter(ModelVersion.process_id == process_id)
        .scalar()
    )

    response = ProcessResponse.from_orm(process)
    response.version_count = version_count
    return response


@router.patch("/spaces/{space_id}/processes/{process_id}", response_model=ProcessResponse)
def update_space_process(
    space_id: str,
    process_id: str,
    payload: SpaceProcessUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a process within a space (rename, move, etc.)."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)
        require_role(current_user, ["editor", "admin"])

    process = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.id == process_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not process:
        raise ResourceNotFoundError("Process", process_id)

    # Ensure process belongs to the target space
    if is_private:
        if process.user_id != user_id or process.organization_id is not None:
            raise ValidationError("Process must belong to the private space")
    else:
        if process.organization_id != organization_id:
            raise ValidationError("Process must belong to the target space")

    # Handle folder move
    if payload.folder_id is not None:
        if payload.folder_id:
            folder = (
                db.query(Folder)
                .filter(
                    Folder.id == payload.folder_id,
                    Folder.deleted_at == None,  # noqa: E711
                )
                .first()
            )
            if not folder:
                raise ResourceNotFoundError("Folder", payload.folder_id)
            # Validate folder belongs to same space
            if is_private:
                if folder.user_id != user_id or folder.organization_id is not None:
                    raise ValidationError("Folder must belong to the same space")
            else:
                if folder.organization_id != organization_id:
                    raise ValidationError("Folder must belong to the same space")
        process.folder_id = payload.folder_id

    if payload.name is not None:
        process.name = payload.name
    if payload.description is not None:
        process.description = payload.description

    db.commit()
    db.refresh(process)

    # Get version count
    from sqlalchemy import func
    from app.db.models import ModelVersion

    version_count = (
        db.query(func.count(ModelVersion.id))
        .filter(ModelVersion.process_id == process_id)
        .scalar()
    )

    response = ProcessResponse.from_orm(process)
    response.version_count = version_count
    return response


@router.delete("/spaces/{space_id}/processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_process(
    space_id: str,
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a process within a space (soft delete)."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)
        require_role(current_user, ["editor", "admin"])

    process = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.id == process_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not process:
        raise ResourceNotFoundError("Process", process_id)

    # Ensure process belongs to the target space
    if is_private:
        if process.user_id != user_id or process.organization_id is not None:
            raise ValidationError("Process must belong to the private space")
    else:
        if process.organization_id != organization_id:
            raise ValidationError("Process must belong to the target space")

    process.deleted_at = datetime.utcnow()
    db.commit()
    return None


@router.patch("/spaces/{space_id}/folders/{folder_id}/move", response_model=FolderTree)
def move_space_folder(
    space_id: str,
    folder_id: str,
    payload: FolderMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Move a folder to a new parent within the same space."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)
        require_role(current_user, ["editor", "admin"])

    folder = (
        db.query(Folder)
        .filter(
            Folder.id == folder_id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    # Ensure folder belongs to the target space
    if is_private:
        if folder.user_id != user_id or folder.organization_id is not None:
            raise ValidationError("Folder must belong to the private space")
    else:
        if folder.organization_id != organization_id:
            raise ValidationError("Folder must belong to the target space")

    # Validate new parent if provided
    if payload.parent_folder_id:
        new_parent = (
            db.query(Folder)
            .filter(
                Folder.id == payload.parent_folder_id,
                Folder.deleted_at == None,  # noqa: E711
            )
            .first()
        )
        if not new_parent:
            raise ResourceNotFoundError("Folder", payload.parent_folder_id)
        # Validate parent belongs to same space
        if is_private:
            if new_parent.user_id != user_id or new_parent.organization_id is not None:
                raise ValidationError("Parent folder must belong to the same space")
        else:
            if new_parent.organization_id != organization_id:
                raise ValidationError("Parent folder must belong to the same space")
        _validate_no_cycle_space_folder(db, folder, payload.parent_folder_id)
    else:
        # Moving to root - validate no cycle not needed
        pass

    folder.parent_folder_id = payload.parent_folder_id
    db.commit()
    db.refresh(folder)

    # Get counts and children for response
    processes_here = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.folder_id == folder.id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .count()
    )
    children_here = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    children = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .order_by(Folder.position, Folder.name)
        .all()
    )
    processes_list = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.folder_id == folder.id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .order_by(ProcessModel.position, ProcessModel.name)
        .all()
    )

    return FolderTree(
        id=folder.id,
        project_id=folder.project_id,
        organization_id=folder.organization_id,
        user_id=folder.user_id,
        parent_folder_id=folder.parent_folder_id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        icon=folder.icon,
        position=folder.position or 0,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        process_count=processes_here,
        child_count=children_here,
        processes=[ProcessResponse.from_orm(p) for p in processes_list],
        children=[
            FolderTree(
                id=child.id,
                project_id=child.project_id,
                organization_id=child.organization_id,
                user_id=child.user_id,
                parent_folder_id=child.parent_folder_id,
                name=child.name,
                description=child.description,
                color=child.color,
                icon=child.icon,
                position=child.position or 0,
                created_at=child.created_at,
                updated_at=child.updated_at,
                process_count=0,
                child_count=0,
                processes=[],
                children=[],
            )
            for child in children
        ],
    )


@router.patch("/spaces/{space_id}/processes/{process_id}/move", response_model=ProcessResponse)
def move_space_process(
    space_id: str,
    process_id: str,
    payload: ProcessMoveRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Move a process to a new folder within the same space."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)
        require_role(current_user, ["editor", "admin"])

    process = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.id == process_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not process:
        raise ResourceNotFoundError("Process", process_id)

    # Ensure process belongs to the target space
    if is_private:
        if process.user_id != user_id or process.organization_id is not None:
            raise ValidationError("Process must belong to the private space")
    else:
        if process.organization_id != organization_id:
            raise ValidationError("Process must belong to the target space")

    # Validate new folder if provided
    if payload.folder_id:
        folder = (
            db.query(Folder)
            .filter(
                Folder.id == payload.folder_id,
                Folder.deleted_at == None,  # noqa: E711
            )
            .first()
        )
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)
        # Validate folder belongs to same space
        if is_private:
            if folder.user_id != user_id or folder.organization_id is not None:
                raise ValidationError("Folder must belong to the same space")
        else:
            if folder.organization_id != organization_id:
                raise ValidationError("Folder must belong to the same space")

    process.folder_id = payload.folder_id
    db.commit()
    db.refresh(process)

    # Get version count
    from sqlalchemy import func
    from app.db.models import ModelVersion

    version_count = (
        db.query(func.count(ModelVersion.id))
        .filter(ModelVersion.process_id == process_id)
        .scalar()
    )

    response = ProcessResponse.from_orm(process)
    response.version_count = version_count
    return response


@router.get("/spaces/{space_id}/folders/{folder_id}/path", response_model=FolderPathResponse)
def get_folder_path(
    space_id: str,
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the full path from root to a folder."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)

    # Solution: Load ALL folders in the space to guarantee consistency with the Sidebar tree.
    # This avoids issues with partial queries or inconsistent parent_folder_id pointers in legacy data.
    
    if is_private:
        all_folders = (
            db.query(Folder)
            .filter(
                Folder.user_id == user_id,
                Folder.organization_id.is_(None),
                Folder.deleted_at == None,
            )
            .all()
        )
    else:
        all_folders = (
            db.query(Folder)
            .filter(
                Folder.organization_id == organization_id,
                Folder.deleted_at == None,
            )
            .all()
        )
        
    # Build map for O(1) traversal
    folder_map = {f.id: f for f in all_folders}
    
    # Verify target folder exists in this space
    if folder_id not in folder_map:
         # It might exist but be deleted or in wrong space, check DB to be sure about 404 vs 403?
         # For simplicity, if it's not in the allowed list, it's not found/accessible.
         raise ResourceNotFoundError("Folder", folder_id)

    path_items: List[FolderPathItem] = []
    current_id = folder_id
    visited = set()

    while current_id and current_id not in visited:
        visited.add(current_id)
        folder = folder_map.get(current_id)
        if not folder:
            break
            
        path_items.insert(0, FolderPathItem(id=folder.id, name=folder.name))
        current_id = folder.parent_folder_id
        
    return FolderPathResponse(
        folder_id=folder_id,
        folder_name=folder_map[folder_id].name,
        path=path_items
    )


@router.get("/spaces/{space_id}/stats", response_model=SpaceStatsResponse)
def get_space_stats(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get statistics for a space."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)

    # Count all folders in space
    total_folders = (
        db.query(Folder)
        .filter(
            Folder.organization_id == organization_id if not is_private else None,
            Folder.user_id == user_id if is_private else None,
            Folder.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    # Count root folders
    root_folders = (
        db.query(Folder)
        .filter(
            Folder.organization_id == organization_id if not is_private else None,
            Folder.user_id == user_id if is_private else None,
            Folder.parent_folder_id.is_(None),
            Folder.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    # Count all processes in space
    total_processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.organization_id == organization_id if not is_private else None,
            ProcessModel.user_id == user_id if is_private else None,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    # Count root processes
    root_processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.organization_id == organization_id if not is_private else None,
            ProcessModel.user_id == user_id if is_private else None,
            ProcessModel.folder_id.is_(None),
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    return SpaceStatsResponse(
        space_id=space_id,
        total_folders=total_folders,
        total_processes=total_processes,
        root_folders=root_folders,
        root_processes=root_processes,
    )


@router.get("/users/me/recents", response_model=RecentsResponse)
def get_my_recents(
    organization_id: Optional[str] = Query(
        None, description="Organization scope for team recents (defaults to active org)"
    ),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return recent folders/processes the user owns or can access."""
    target_org_id = organization_id or current_user.organization_id
    items: List[RecentItem] = []

    # Private recents
    private_processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.user_id == current_user.id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .order_by(ProcessModel.updated_at.desc())
        .limit(limit)
        .all()
    )
    private_folders = (
        db.query(Folder)
        .filter(
            Folder.user_id == current_user.id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .order_by(Folder.updated_at.desc())
        .limit(limit)
        .all()
    )

    for proc in private_processes:
        items.append(
            RecentItem(
                id=proc.id,
                type="process",
                name=proc.name,
                space_type="private",
                space_id=proc.user_id,
                parent_folder_id=proc.folder_id,
                updated_at=proc.updated_at,
            )
        )
    for folder in private_folders:
        items.append(
            RecentItem(
                id=folder.id,
                type="folder",
                name=folder.name,
                space_type="private",
                space_id=folder.user_id,
                parent_folder_id=folder.parent_folder_id,
                updated_at=folder.updated_at,
            )
        )

    # Team recents
    if target_org_id:
        try:
            require_organization_access(current_user, target_org_id, db=db)
        except Exception:
            target_org_id = None  # skip team recents if no access

    if target_org_id:
        team_processes = (
            db.query(ProcessModel)
            .filter(
                ProcessModel.organization_id == target_org_id,
                ProcessModel.deleted_at == None,  # noqa: E711
            )
            .order_by(ProcessModel.updated_at.desc())
            .limit(limit)
            .all()
        )
        team_folders = (
            db.query(Folder)
            .filter(
                Folder.organization_id == target_org_id,
                Folder.deleted_at == None,  # noqa: E711
            )
            .order_by(Folder.updated_at.desc())
            .limit(limit)
            .all()
        )
        for proc in team_processes:
            items.append(
                RecentItem(
                    id=proc.id,
                    type="process",
                    name=proc.name,
                    space_type="team",
                    space_id=target_org_id,
                    parent_folder_id=proc.folder_id,
                    updated_at=proc.updated_at,
                )
            )
        for folder in team_folders:
            items.append(
                RecentItem(
                    id=folder.id,
                    type="folder",
                    name=folder.name,
                    space_type="team",
                    space_id=target_org_id,
                    parent_folder_id=folder.parent_folder_id,
                    updated_at=folder.updated_at,
                )
            )

    # Sort combined list and enforce limit
    items.sort(key=lambda i: i.updated_at, reverse=True)
    return RecentsResponse(items=items[:limit])





