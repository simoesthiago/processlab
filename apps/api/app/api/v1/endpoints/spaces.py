"""
Spaces endpoints (simplified for Private Space only)

Local-first single-user mode - no authentication required.
"""

from typing import Dict, List, Optional
from datetime import datetime
import logging

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.core.dependencies import (
    get_create_folder_use_case,
    get_folder_repository,
    get_process_repository,
    get_space_details_use_case,
    get_space_stats_use_case
)
from app.application.folders.create_folder import CreateFolderCommand
from app.application.spaces.get_space_tree import GetSpaceTreeUseCase
from app.application.spaces.get_space_details import GetSpaceDetailsUseCase
from app.application.spaces.get_space_stats import GetSpaceStatsUseCase
from app.db.models import Folder, ProcessModel, ModelVersion, LOCAL_USER_ID
from app.db.session import get_db
from app.api.schemas.folders import FolderTree, FolderCreateRequest, FolderUpdateRequest, FolderCreate, FolderUpdate, FolderPathItem, FolderPathResponse
from app.api.schemas.spaces import (
    RecentsResponse,
    RecentItem,
    SpaceListResponse,
    SpaceProcessCreateRequest,
    SpaceSummary,
    SpaceTreeResponse,
    SpaceProcessUpdateRequest,
    SpaceStatsResponse,
    SpaceProcessCreate,
    SpaceProcessUpdate,
)
from app.api.schemas.processes import ProcessResponse
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger(__name__)


# ============================================================================
# Helper Functions
# ============================================================================

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

    def safe_process_response(process: ProcessModel) -> ProcessResponse:
        """Safely convert ProcessModel to ProcessResponse."""
        return ProcessResponse(
            id=process.id,
            name=process.name or "Unnamed Process",
            description=process.description,
            folder_id=process.folder_id,
            user_id=str(process.user_id) if process.user_id else None,
            current_version_id=process.current_version_id,
            created_by=str(process.created_by) if process.created_by else None,
            created_at=process.created_at or datetime.utcnow(),
            updated_at=process.updated_at or datetime.utcnow(),
            version_count=0,
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
            processes=[safe_process_response(p) for p in processes_here],
            children=[build_node(child) for child in children],
        )

    roots = folder_children.get(None, [])
    root_processes = [safe_process_response(proc) for proc in process_by_folder.get(None, [])]

    return SpaceTreeResponse(
        space_type="private",
        space_id=space_id,
        root_folders=[build_node(f) for f in roots],
        root_processes=root_processes
    )


def _cascade_delete_folder(db: Session, folder: Folder, now: datetime):
    """Soft delete folder, its children and contained processes."""
    folder.deleted_at = now
    db.query(ProcessModel).filter(
        ProcessModel.folder_id == folder.id,
        ProcessModel.deleted_at == None,
    ).update({"deleted_at": now})
    children = db.query(Folder).filter(
        Folder.parent_folder_id == folder.id,
        Folder.deleted_at == None,
    ).all()
    for child in children:
        _cascade_delete_folder(db, child, now)


def _validate_no_cycle(db: Session, folder: Folder, new_parent_id: str | None):
    """Ensure we never create circular references when moving folders."""
    if new_parent_id is None:
        return
    if new_parent_id == folder.id:
        raise ValidationError("Folder cannot be its own parent")
    current = db.query(Folder).filter(Folder.id == new_parent_id, Folder.deleted_at == None).first()
    if not current:
        raise ResourceNotFoundError("Folder", new_parent_id)
    while current.parent_folder_id:
        if current.parent_folder_id == folder.id:
            raise ValidationError("Cannot move folder inside its own subtree")
        current = db.query(Folder).filter(Folder.id == current.parent_folder_id, Folder.deleted_at == None).first()
        if not current:
            break


# ============================================================================
# Space Endpoints
# ============================================================================

@router.get("/spaces", response_model=SpaceListResponse)
def list_spaces():
    """List all spaces (only private space in local-first mode)."""
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


@router.get("/spaces/private/tree", response_model=SpaceTreeResponse)
def get_private_space_tree(db: Session = Depends(get_db)):
    """Return root folders/processes for the Private Space."""
    use_case = GetSpaceTreeUseCase(
        get_folder_repository(db),
        get_process_repository(db)
    )
    return use_case.execute("private")


@router.get("/spaces/{space_id}/tree", response_model=SpaceTreeResponse)
def get_space_tree(space_id: str, db: Session = Depends(get_db)):
    """Generic tree endpoint (only supports 'private')."""
    if space_id != "private":
        raise ResourceNotFoundError("Space", space_id)
    
    use_case = GetSpaceTreeUseCase(
        get_folder_repository(db),
        get_process_repository(db)
    )
    return use_case.execute(space_id)


@router.get("/spaces/{space_id}")
def get_space_details(
    space_id: str,
    db: Session = Depends(get_db)
):
    """Get space details."""
    use_case = get_space_details_use_case(db)
    return use_case.execute(space_id)


# ============================================================================
# Folder Endpoints
# ============================================================================

@router.post("/spaces/{space_id}/folders", response_model=FolderTree, status_code=status.HTTP_201_CREATED)
def create_space_folder(
    space_id: str,
    folder_data: FolderCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a folder under a space."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    use_case = get_create_folder_use_case(db)
    folder_repo = get_folder_repository(db)
    process_repo = get_process_repository(db)
    
    # Calculate position if not provided
    position = folder_data.position
    if position is None:
        siblings = folder_repo.find_all(parent_folder_id=folder_data.parent_folder_id)
        position = len(siblings)

    command = CreateFolderCommand(
        name=folder_data.name,
        description=folder_data.description,
        parent_folder_id=folder_data.parent_folder_id,
        position=position or 0,
        color=folder_data.color,
        icon=folder_data.icon
    )
    
    folder = use_case.execute(command)
    
    # Build response
    children = folder_repo.find_all(parent_folder_id=folder.id)
    processes = process_repo.find_all(folder_id=folder.id)
    
    return FolderTree(
        id=folder.id,
        user_id="local-user",
        parent_folder_id=folder.parent_folder_id,
        name=folder.name,
        description=folder.description,
        color=folder.color,
        icon=folder.icon,
        position=folder.position or 0,
        created_at=folder.created_at,
        updated_at=folder.updated_at,
        process_count=len(processes),
        child_count=len(children),
        processes=[],
        children=[],
    )


@router.get("/spaces/{space_id}/folders/{folder_id}", response_model=FolderTree)
def get_space_folder(
    space_id: str,
    folder_id: str,
    db: Session = Depends(get_db),
):
    """Get details of a specific folder within a space."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.deleted_at == None,
    ).first()
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    children = db.query(Folder).filter(
        Folder.parent_folder_id == folder_id,
        Folder.deleted_at == None,
    ).order_by(Folder.position, Folder.name).all()
    
    processes_here = db.query(ProcessModel).filter(
        ProcessModel.folder_id == folder_id,
        ProcessModel.deleted_at == None,
    ).order_by(ProcessModel.position, ProcessModel.name).all()

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
        processes=[ProcessResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            folder_id=p.folder_id,
            user_id=p.user_id,
            created_at=p.created_at,
            updated_at=p.updated_at,
        ) for p in processes_here],
        children=[FolderTree(
            id=c.id,
            user_id=c.user_id,
            parent_folder_id=c.parent_folder_id,
            name=c.name,
            description=c.description,
            color=c.color,
            icon=c.icon,
            position=c.position or 0,
            created_at=c.created_at,
            updated_at=c.updated_at,
            process_count=0,
            child_count=0,
            processes=[],
            children=[],
        ) for c in children],
    )


@router.patch("/spaces/{space_id}/folders/{folder_id}", response_model=FolderTree)
def update_space_folder(
    space_id: str,
    folder_id: str,
    folder_data: FolderUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update a folder within a space."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.deleted_at == None,
    ).first()
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    if folder_data.parent_folder_id is not None:
        if folder_data.parent_folder_id:
            new_parent = db.query(Folder).filter(
                Folder.id == folder_data.parent_folder_id,
                Folder.deleted_at == None,
            ).first()
            if not new_parent:
                raise ResourceNotFoundError("Folder", folder_data.parent_folder_id)
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

    return get_space_folder(space_id, folder_id, db)


@router.delete("/spaces/{space_id}/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_folder(
    space_id: str,
    folder_id: str,
    db: Session = Depends(get_db),
):
    """Delete a folder with cascade."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.deleted_at == None,
    ).first()
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    now = datetime.utcnow()
    _cascade_delete_folder(db, folder, now)
    db.commit()
    return None


# ============================================================================
# Process Endpoints
# ============================================================================

@router.post("/spaces/{space_id}/processes", response_model=ProcessResponse, status_code=status.HTTP_201_CREATED)
def create_space_process(
    space_id: str,
    payload: SpaceProcessCreateRequest,
    db: Session = Depends(get_db),
):
    """Create a process in a space."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")
    
    folder_id_str = None
    if payload.folder_id:
        folder = db.query(Folder).filter(
            Folder.id == payload.folder_id,
            Folder.deleted_at == None,
        ).first()
        if not folder:
            raise ResourceNotFoundError("Folder", payload.folder_id)
        folder_id_str = str(payload.folder_id)
    
    if not payload.name or not payload.name.strip():
        raise ValidationError("Process name cannot be empty")
    
    process = ProcessModel(
        folder_id=folder_id_str,
        name=payload.name,
        description=payload.description,
        user_id=LOCAL_USER_ID,
        created_by=LOCAL_USER_ID,
    )
    
    db.add(process)
    db.commit()
    db.refresh(process)
    
    return ProcessResponse(
        id=process.id,
        name=process.name,
        description=process.description,
        folder_id=process.folder_id,
        user_id=process.user_id,
        created_at=process.created_at,
        updated_at=process.updated_at,
        version_count=0,
        status="draft"
    )


@router.get("/spaces/{space_id}/processes/{process_id}", response_model=ProcessResponse)
def get_space_process(
    space_id: str,
    process_id: str,
    db: Session = Depends(get_db),
):
    """Get details of a specific process."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.user_id == LOCAL_USER_ID,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)
    
    version_count = db.query(func.count(ModelVersion.id)).filter(
        ModelVersion.process_id == process_id
    ).scalar() or 0

    return ProcessResponse(
        id=process.id,
        name=process.name,
        description=process.description,
        folder_id=process.folder_id,
        user_id=process.user_id,
        current_version_id=process.current_version_id,
        created_at=process.created_at,
        updated_at=process.updated_at,
        version_count=version_count,
        status="ready" if process.current_version_id else "draft"
    )


@router.patch("/spaces/{space_id}/processes/{process_id}", response_model=ProcessResponse)
def update_space_process(
    space_id: str,
    process_id: str,
    payload: SpaceProcessUpdateRequest,
    db: Session = Depends(get_db),
):
    """Update a process."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)

    if payload.name is not None:
        process.name = payload.name
    if payload.description is not None:
        process.description = payload.description
    if payload.folder_id is not None:
        if payload.folder_id:
            folder = db.query(Folder).filter(
                Folder.id == payload.folder_id,
                Folder.deleted_at == None
            ).first()
            if not folder:
                raise ResourceNotFoundError("Folder", payload.folder_id)
        process.folder_id = payload.folder_id

    db.commit()
    db.refresh(process)
    
    return get_space_process(space_id, process_id, db)


@router.delete("/spaces/{space_id}/processes/{process_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_process(
    space_id: str,
    process_id: str,
    db: Session = Depends(get_db),
):
    """Delete a process."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    process = db.query(ProcessModel).filter(
        ProcessModel.id == process_id,
        ProcessModel.deleted_at == None
    ).first()
    
    if not process:
        raise ResourceNotFoundError("Process", process_id)

    process.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ============================================================================
# Path & Recents Endpoints
# ============================================================================

@router.get("/spaces/{space_id}/folders/{folder_id}/path", response_model=FolderPathResponse)
def get_folder_path(
    space_id: str,
    folder_id: str,
    db: Session = Depends(get_db),
):
    """Get the full path from root to a folder."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    folder = db.query(Folder).filter(
        Folder.id == folder_id,
        Folder.deleted_at == None
    ).first()
    
    if not folder:
        raise ResourceNotFoundError("Folder", folder_id)

    path_items = []
    current = folder
    while current:
        path_items.insert(0, FolderPathItem(
            id=current.id,
            name=current.name,
            parent_folder_id=current.parent_folder_id
        ))
        if current.parent_folder_id:
            current = db.query(Folder).filter(Folder.id == current.parent_folder_id).first()
        else:
            current = None

    return FolderPathResponse(
        folder_id=folder_id,
        space_id=space_id,
        path=path_items
    )


@router.get("/spaces/{space_id}/recents", response_model=RecentsResponse)
def get_recents(
    space_id: str,
    limit: int = Query(default=10, le=50),
    db: Session = Depends(get_db),
):
    """Get recently updated items."""
    if space_id != "private":
        raise ValidationError("Only private space is supported")

    recent_processes = db.query(ProcessModel).filter(
        ProcessModel.user_id == LOCAL_USER_ID,
        ProcessModel.deleted_at == None
    ).order_by(ProcessModel.updated_at.desc()).limit(limit).all()

    items = [
        RecentItem(
            id=p.id,
            name=p.name,
            type="process",
            updated_at=p.updated_at,
            folder_id=p.folder_id
        )
        for p in recent_processes
    ]

    return RecentsResponse(items=items)


@router.get("/spaces/{space_id}/stats", response_model=SpaceStatsResponse)
def get_space_stats(
    space_id: str,
    db: Session = Depends(get_db)
):
    """Get statistics for a space."""
    use_case = get_space_stats_use_case(db)
    stats = use_case.execute(space_id)
    return SpaceStatsResponse(**stats)
