"""
Organizations API Endpoints

Handles organization management and membership.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from slugify import slugify

from app.db.session import get_db
from app.db.models import Organization, User, Project, OrganizationMember
from app.core.dependencies import get_current_user, require_organization_access

router = APIRouter()


# Pydantic models
class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    role: str  # User's role in this org
    
    class Config:
        from_attributes = True


class OrganizationsListResponse(BaseModel):
    organizations: List[OrganizationResponse]


class OrganizationDetailResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    settings: Optional[dict]
    created_at: str
    
    class Config:
        from_attributes = True


class ProjectListItem(BaseModel):
    id: str
    name: str
    description: Optional[str]
    process_count: int = 0
    tags: Optional[List[str]]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class OrganizationProjectsResponse(BaseModel):
    projects: List[ProjectListItem]
    total_count: int


@router.get("/me", response_model=OrganizationsListResponse)
async def get_my_organizations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all organizations the current user belongs to.
    """
    organizations = []

    memberships = (
        db.query(OrganizationMember)
        .join(Organization, OrganizationMember.organization_id == Organization.id)
        .filter(
            OrganizationMember.user_id == current_user.id,
            OrganizationMember.deleted_at.is_(None),
            Organization.deleted_at.is_(None),
        )
        .all()
    )

    # Backward compatibility: include active org if no membership exists yet
    if not memberships and current_user.organization_id:
        org = (
            db.query(Organization)
            .filter(
                Organization.id == current_user.organization_id,
                Organization.deleted_at.is_(None),
            )
            .first()
        )
        if org:
            organizations.append(
                OrganizationResponse(
                    id=org.id,
                    name=org.name,
                    slug=org.slug,
                    description=org.description,
                    role=current_user.role or "viewer",
                )
            )

    for membership in memberships:
        org = membership.organization
        if not org:
            continue
        organizations.append(
            OrganizationResponse(
                id=org.id,
                name=org.name,
                slug=org.slug,
                description=org.description,
                role=membership.role or "viewer",
            )
        )

    return OrganizationsListResponse(organizations=organizations)


@router.get("/{org_id}", response_model=OrganizationDetailResponse)
async def get_organization(
    org_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get organization details by ID.
    User must be a member of the organization.
    """
    org = db.query(Organization).filter(
        Organization.id == org_id,
        Organization.deleted_at.is_(None)
    ).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check user has access (supports multi-org via membership)
    try:
        require_organization_access(current_user, org_id, db=db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        ) from exc
    
    return OrganizationDetailResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        description=org.description,
        settings=org.settings,
        created_at=org.created_at.isoformat()
    )


@router.get("/slug/{slug}", response_model=OrganizationDetailResponse)
async def get_organization_by_slug(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get organization details by slug.
    User must be a member of the organization.
    """
    org = db.query(Organization).filter(
        Organization.slug == slug,
        Organization.deleted_at.is_(None)
    ).first()
    
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found"
        )
    
    # Check user has access (supports multi-org via membership)
    try:
        require_organization_access(current_user, org.id, db=db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        ) from exc
    
    return OrganizationDetailResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        description=org.description,
        settings=org.settings,
        created_at=org.created_at.isoformat()
    )


@router.get("/{org_id}/projects", response_model=OrganizationProjectsResponse)
async def get_organization_projects(
    org_id: str,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all projects in an organization.
    User must be a member of the organization.
    """
    # Check user has access to org
    try:
        require_organization_access(current_user, org_id, db=db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this organization"
        ) from exc
    
    # Get projects
    projects_query = db.query(Project).filter(
        Project.organization_id == org_id,
        Project.deleted_at.is_(None)
    )
    
    total_count = projects_query.count()
    projects = projects_query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()
    
    project_list = []
    for project in projects:
        process_count = len(project.processes) if project.processes else 0
        project_list.append(ProjectListItem(
            id=project.id,
            name=project.name,
            description=project.description,
            process_count=process_count,
            tags=project.tags,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat()
        ))
    
    return OrganizationProjectsResponse(
        projects=project_list,
        total_count=total_count
    )


@router.post("", response_model=OrganizationDetailResponse)
async def create_organization(
    org_data: OrganizationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new organization.
    The creating user becomes the admin.
    """
    # Generate slug
    base_slug = slugify(org_data.name)
    slug = base_slug
    counter = 1
    
    while db.query(Organization).filter(Organization.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    # Create organization
    org = Organization(
        name=org_data.name,
        slug=slug,
        description=org_data.description
    )
    db.add(org)
    db.flush()
    
    # Update user to be admin of this organization and add membership
    current_user.organization_id = org.id
    current_user.role = "admin"
    membership = OrganizationMember(
        organization_id=org.id,
        user_id=current_user.id,
        role="admin",
        status="active",
    )
    db.add(membership)
    
    db.commit()
    db.refresh(org)
    
    return OrganizationDetailResponse(
        id=org.id,
        name=org.name,
        slug=org.slug,
        description=org.description,
        settings=org.settings,
        created_at=org.created_at.isoformat()
    )
