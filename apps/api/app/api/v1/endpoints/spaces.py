"""
Spaces endpoints (Notion-like navigation)

- Private Space tree
- Team Space tree (active organization)
- Recents for the current user
"""

from typing import Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from slugify import slugify
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, require_organization_access
from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.db.models import Folder, Organization, OrganizationMember, ProcessModel, User
from app.db.session import get_db
from app.schemas.auth import ProcessResponse
from app.schemas.hierarchy import FolderTree, FolderCreate
from app.schemas.spaces import (
    RecentsResponse,
    RecentItem,
    SpaceCreate,
    SpaceDetailResponse,
    SpaceListResponse,
    SpaceProcessCreate,
    SpaceSummary,
    SpaceTreeResponse,
)

router = APIRouter()


def _build_space_tree(
    folders: List[Folder],
    processes: List[ProcessModel],
    space_type: str,
    space_id: Optional[str],
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

    roots = folder_children.get(None, [])

    root_processes = [
        ProcessResponse.from_orm(proc) for proc in process_by_folder.get(None, [])
    ]

    return SpaceTreeResponse(
        space_type=space_type, space_id=space_id, root_folders=[build_node(f) for f in roots], root_processes=root_processes
    )


def _user_role_for_org(db: Session, org_id: str, user_id: str) -> Optional[str]:
    membership = (
        db.query(OrganizationMember)
        .filter(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == user_id,
            OrganizationMember.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    return membership.role if membership else None


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
            Folder.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.user_id == current_user.id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    return _build_space_tree(folders, processes, "private", current_user.id)


@router.get("/spaces/team/tree", response_model=SpaceTreeResponse)
def get_team_space_tree(
    organization_id: Optional[str] = Query(
        None, description="Target organization ID (defaults to active org)"
    ),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return root folders/processes for the active organization (Team Space)."""
    target_org_id = organization_id or current_user.organization_id
    if not target_org_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active organization set for team space",
        )

    require_organization_access(current_user, target_org_id, db=db)

    org_exists = (
        db.query(Organization)
        .filter(
            Organization.id == target_org_id,
            Organization.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not org_exists:
        raise ResourceNotFoundError("Organization", target_org_id)

    folders = (
        db.query(Folder)
        .filter(
            Folder.organization_id == target_org_id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.organization_id == target_org_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    return _build_space_tree(folders, processes, "team", target_org_id)


@router.get("/spaces", response_model=SpaceListResponse)
def list_spaces(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all spaces visible to the current user (private + org memberships)."""
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

    memberships = (
        db.query(OrganizationMember, Organization)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .filter(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.deleted_at == None,  # noqa: E711
            Organization.deleted_at == None,  # noqa: E711
        )
        .all()
    )

    for membership, org in memberships:
        spaces.append(
            SpaceSummary(
                id=org.id,
                name=org.name,
                description=org.description,
                type="team",
                role=membership.role if membership.role in ["admin", "editor", "viewer"] else "viewer",
                is_protected=False,
            )
        )

    return SpaceListResponse(spaces=spaces)


@router.post("/spaces", response_model=SpaceDetailResponse, status_code=status.HTTP_201_CREATED)
def create_space(
    payload: SpaceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new team space (backed by Organization) and add creator as admin."""
    base_slug = slugify(payload.name)
    slug = base_slug
    counter = 1
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    org = Organization(
        name=payload.name,
        slug=slug,
        description=payload.description,
    )
    db.add(org)
    db.flush()

    membership = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="admin",
        status="active",
    )
    db.add(membership)
    db.commit()
    db.refresh(org)

    return SpaceDetailResponse(
        id=org.id,
        name=org.name,
        description=org.description,
        type="team",
        role="admin",
        is_protected=False,
        created_at=org.created_at,
    )


@router.get("/spaces/{space_id}/tree", response_model=SpaceTreeResponse)
def get_space_tree(
    space_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generic tree endpoint for any space (private or team by org id)."""
    if space_id == "private":
        return get_private_space_tree(current_user=current_user, db=db)

    require_organization_access(current_user, space_id, db=db)
    org_exists = (
        db.query(Organization)
        .filter(
            Organization.id == space_id,
            Organization.deleted_at == None,  # noqa: E711
        )
        .first()
    )
    if not org_exists:
        raise ResourceNotFoundError("Organization", space_id)

    folders = (
        db.query(Folder)
        .filter(
            Folder.organization_id == space_id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    processes = (
        db.query(ProcessModel)
        .filter(
            ProcessModel.organization_id == space_id,
            ProcessModel.deleted_at == None,  # noqa: E711
        )
        .all()
    )
    return _build_space_tree(folders, processes, "team", space_id)


def _cascade_delete_folder(db: Session, folder: Folder, now: datetime):
    """Soft delete folder, its children and contained processes."""
    folder.deleted_at = now
    db.query(ProcessModel).filter(
        ProcessModel.folder_id == folder.id,
        ProcessModel.deleted_at == None,  # noqa: E711
    ).update({"deleted_at": now})
    children = (
        db.query(Folder)
        .filter(
            Folder.parent_folder_id == folder.id,
            Folder.deleted_at == None,  # noqa: E711
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
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)

    if folder_data.parent_folder_id:
        parent = (
            db.query(Folder)
            .filter(
                Folder.id == folder_data.parent_folder_id,
                Folder.deleted_at == None,  # noqa: E711
            )
            .first()
        )
        if not parent:
            raise ResourceNotFoundError("Folder", folder_data.parent_folder_id)
        # Validate parent belongs to same space
        if (is_private and parent.user_id != user_id) or (
            not is_private and parent.organization_id != organization_id
        ):
            raise ValidationError("Parent folder must belong to the same space")

    position = (
        folder_data.position
        if folder_data.position is not None
        else db.query(Folder)
        .filter(
            Folder.organization_id == organization_id,
            Folder.user_id == user_id,
            Folder.parent_folder_id == folder_data.parent_folder_id,
            Folder.deleted_at == None,  # noqa: E711
        )
        .count()
    )

    folder = Folder(
        project_id=None,
        organization_id=organization_id,
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

    return FolderTree(
        **FolderTree.model_validate(folder).model_dump(),
        process_count=processes_here,
        child_count=children_here,
        processes=[],
        children=[],
    )


@router.delete("/spaces/{space_id}/folders/{folder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_space_folder(
    space_id: str,
    folder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a folder within a space (private or team) with cascade on children and processes."""
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)

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
    is_private = space_id == "private"
    organization_id = None if is_private else space_id
    user_id = current_user.id if is_private else None

    if not is_private:
        require_organization_access(current_user, space_id, db=db)

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
        if (is_private and folder.user_id != user_id) or (
            not is_private and folder.organization_id != organization_id
        ):
            raise ValidationError("Folder must belong to the same space")
    process = ProcessModel(
        project_id=None,
        folder_id=payload.folder_id,
        name=payload.name,
        description=payload.description,
        organization_id=organization_id,
        user_id=user_id,
        created_by=current_user.id,
    )

    db.add(process)
    db.commit()
    db.refresh(process)

    return ProcessResponse.from_orm(process)


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

