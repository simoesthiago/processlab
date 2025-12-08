"""
Folder and hierarchy endpoints.

Provides CRUD for folders and a combined hierarchy view (project → folders → processes)
to power drag-and-drop UX on the frontend.
"""

from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import (
    get_current_user,
    require_organization_access,
    require_role,
)
from app.core.exceptions import AuthorizationError, ResourceNotFoundError, ValidationError
from app.db.models import Folder, ProcessModel, Project, User
from app.db.session import get_db
from app.schemas.auth import ProcessResponse
from app.schemas.hierarchy import (
    FolderCreate,
    FolderResponse,
    FolderTree,
    FolderUpdate,
    ProjectHierarchyResponse,
)

router = APIRouter()


# --- Helpers -----------------------------------------------------------------
def _ensure_project_access(project: Project, current_user: User):
    """Guard access for both org and personal projects."""
    if project.organization_id:
        require_organization_access(current_user, project.organization_id)
    else:
        if not current_user.is_superuser and project.owner_id != current_user.id:
            raise AuthorizationError("Access denied to this personal project")


def _get_project_or_404(db: Session, project_id: str) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.deleted_at == None)  # noqa: E711
        .first()
    )
    if not project:
        raise ResourceNotFoundError("Project", project_id)
    return project


def _get_folder_or_404(db: Session, folder_id: str) -> Folder:
    folder = (
        db.query(Folder)
        .filter(Folder.id == folder_id, Folder.deleted_at == None)  # noqa: E711
        .first()
    )
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)
    return folder


def _build_hierarchy(
    folders: List[Folder], processes: List[ProcessModel], project_id: str
) -> ProjectHierarchyResponse:
    """Construct a tree from flat folders/processes."""
    folder_children: Dict[str | None, List[Folder]] = {}
    for folder in folders:
        folder_children.setdefault(folder.parent_folder_id, []).append(folder)

    process_by_folder: Dict[str | None, List[ProcessModel]] = {}
    for process in processes:
        process_by_folder.setdefault(process.folder_id, []).append(process)

    # Order folders/processes by position then name for consistent UI
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
        node = FolderTree(
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
            process_count=len(processes_here),
            child_count=len(children),
            processes=[ProcessResponse.from_orm(p) for p in processes_here],
            children=[build_node(child) for child in children],
        )
        return node

    roots = folder_children.get(None, [])

    root_processes = [
        ProcessResponse.from_orm(proc) for proc in process_by_folder.get(None, [])
    ]

    return ProjectHierarchyResponse(
        project_id=project_id,
        root_processes=root_processes,
        folders=[build_node(folder) for folder in roots],
    )


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


# --- Routes ------------------------------------------------------------------
@router.get(
    "/projects/{project_id}/hierarchy", response_model=ProjectHierarchyResponse
)
def get_project_hierarchy(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return folders + processes grouped for a project."""
    project = _get_project_or_404(db, project_id)
    _ensure_project_access(project, current_user)

    folders = (
        db.query(Folder)
        .filter(Folder.project_id == project_id, Folder.deleted_at == None)  # noqa: E711
        .all()
    )
    processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.project_id == project_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .all()
    )

    return _build_hierarchy(folders, processes, project_id)


@router.post(
    "/projects/{project_id}/folders",
    response_model=FolderResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_folder(
    project_id: str,
    folder_data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a folder under a project (or nested within another folder)."""
    project = _get_project_or_404(db, project_id)
    _ensure_project_access(project, current_user)
    require_role(current_user, ["editor", "admin"])

    # Validate parent folder if provided
    if folder_data.parent_folder_id:
        parent = _get_folder_or_404(db, folder_data.parent_folder_id)
        if parent.project_id != project_id:
            raise ValidationError("Parent folder must belong to the same project")

    position = (
        folder_data.position
        if folder_data.position is not None
        else db.query(Folder).filter(
            Folder.project_id == project_id,
            Folder.parent_folder_id == folder_data.parent_folder_id,
            Folder.deleted_at == None,  # noqa: E711
        ).count()
    )

    folder = Folder(
        project_id=project_id,
        organization_id=project.organization_id,
        user_id=project.owner_id if not project.organization_id else None,
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

    return FolderResponse.from_orm(folder)


@router.patch("/folders/{folder_id}", response_model=FolderResponse)
def update_folder(
    folder_id: str,
    folder_data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename, recolor, or move a folder."""
    folder = _get_folder_or_404(db, folder_id)
    project = _get_project_or_404(db, folder.project_id)
    _ensure_project_access(project, current_user)
    require_role(current_user, ["editor", "admin"])

    # Handle move/parent change
    if folder_data.parent_folder_id is not None:
        if folder_data.parent_folder_id:
            new_parent = _get_folder_or_404(db, folder_data.parent_folder_id)
            if new_parent.project_id != folder.project_id:
                raise ValidationError("Folder can only be moved inside the same project")
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
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .count()
    )
    child_count = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,  # noqa: E711
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
    project = _get_project_or_404(db, folder.project_id)
    _ensure_project_access(project, current_user)
    require_role(current_user, ["editor", "admin"])

    now = datetime.utcnow()

    def cascade_delete(target: Folder):
        # Mark folder
        target.deleted_at = now
        # Delete contained processes
        db.query(ProcessModel).filter(
            ProcessModel.folder_id == target.id,
            ProcessModel.deleted_at == None,  # noqa: E711
        ).update({"deleted_at": now})
        # Recurse into children
        children = db.query(Folder).filter(
            Folder.parent_folder_id == target.id,
            Folder.deleted_at == None,  # noqa: E711
        )
        for child in children:
            cascade_delete(child)

    cascade_delete(folder)
    db.commit()
    return None


