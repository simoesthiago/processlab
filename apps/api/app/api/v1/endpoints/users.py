"""
Users API Endpoints

Handles user-specific resources like personal projects and shared items.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.db.models import User, Project, ProjectShare, ProcessModel
from app.core.dependencies import get_current_user

router = APIRouter()


# Pydantic models
class PersonalProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    visibility: str = "private"  # private, shared, public


class PersonalProjectResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    visibility: str
    process_count: int = 0
    share_count: int = 0
    tags: Optional[List[str]]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class PersonalProjectsListResponse(BaseModel):
    projects: List[PersonalProjectResponse]
    total_count: int


class SharedWithMeItem(BaseModel):
    id: str
    project_id: str
    project_name: str
    owner_name: str
    owner_email: str
    permission: str
    shared_at: str
    
    class Config:
        from_attributes = True


class SharedWithMeResponse(BaseModel):
    shared: List[SharedWithMeItem]
    total_count: int


class UserStatsResponse(BaseModel):
    project_count: int
    process_count: int
    shared_with_me: int


class ActivityItem(BaseModel):
    id: str
    type: str
    title: str
    workspace_name: str
    workspace_slug: str
    workspace_type: str
    created_at: str


class UserActivityResponse(BaseModel):
    activities: List[ActivityItem]


@router.get("/me/projects", response_model=PersonalProjectsListResponse)
async def get_my_personal_projects(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's personal projects.
    """
    projects_query = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),  # Personal projects have no org
        Project.deleted_at.is_(None)
    )
    
    total_count = projects_query.count()
    projects = projects_query.order_by(Project.updated_at.desc()).offset(skip).limit(limit).all()
    
    project_list = []
    for project in projects:
        process_count = len(project.processes) if project.processes else 0
        share_count = len([s for s in project.shares if not s.revoked_at]) if project.shares else 0
        
        project_list.append(PersonalProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            visibility=project.visibility or "private",
            process_count=process_count,
            share_count=share_count,
            tags=project.tags,
            created_at=project.created_at.isoformat(),
            updated_at=project.updated_at.isoformat()
        ))
    
    return PersonalProjectsListResponse(
        projects=project_list,
        total_count=total_count
    )


@router.post("/me/projects", response_model=PersonalProjectResponse)
async def create_personal_project(
    project_data: PersonalProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new personal project.
    """
    project = Project(
        name=project_data.name,
        description=project_data.description,
        tags=project_data.tags,
        visibility=project_data.visibility,
        owner_id=current_user.id,
        created_by=current_user.id,
        organization_id=None  # Personal projects have no org
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    return PersonalProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        visibility=project.visibility or "private",
        process_count=0,
        share_count=0,
        tags=project.tags,
        created_at=project.created_at.isoformat(),
        updated_at=project.updated_at.isoformat()
    )


@router.get("/me/shared", response_model=SharedWithMeResponse)
async def get_shared_with_me(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get projects shared with the current user.
    """
    shares_query = db.query(ProjectShare).filter(
        ProjectShare.shared_with_user_id == current_user.id,
        ProjectShare.revoked_at.is_(None),
        # Exclude expired shares
        (ProjectShare.expires_at.is_(None) | (ProjectShare.expires_at > datetime.utcnow()))
    )
    
    total_count = shares_query.count()
    shares = shares_query.order_by(ProjectShare.created_at.desc()).offset(skip).limit(limit).all()
    
    shared_items = []
    for share in shares:
        project = share.project
        owner = share.owner
        
        if project and owner:
            shared_items.append(SharedWithMeItem(
                id=share.id,
                project_id=project.id,
                project_name=project.name,
                owner_name=owner.full_name or owner.email,
                owner_email=owner.email,
                permission=share.permission,
                shared_at=share.created_at.isoformat()
            ))
    
    return SharedWithMeResponse(
        shared=shared_items,
        total_count=total_count
    )


@router.get("/me/stats", response_model=UserStatsResponse)
async def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for the current user.
    """
    # Count personal projects
    project_count = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),
        Project.deleted_at.is_(None)
    ).count()
    
    # Count processes in personal projects
    process_count = db.query(ProcessModel).join(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),
        Project.deleted_at.is_(None),
        ProcessModel.deleted_at.is_(None)
    ).count()
    
    # Count shared with me
    shared_with_me = db.query(ProjectShare).filter(
        ProjectShare.shared_with_user_id == current_user.id,
        ProjectShare.revoked_at.is_(None),
        (ProjectShare.expires_at.is_(None) | (ProjectShare.expires_at > datetime.utcnow()))
    ).count()
    
    return UserStatsResponse(
        project_count=project_count,
        process_count=process_count,
        shared_with_me=shared_with_me
    )


@router.get("/me/activity", response_model=UserActivityResponse)
async def get_my_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent activity for the current user.
    """
    # For now, return recent projects and processes
    # In a full implementation, this would query an audit/activity log
    
    activities = []
    
    # Get recent personal projects
    personal_projects = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),
        Project.deleted_at.is_(None)
    ).order_by(Project.updated_at.desc()).limit(5).all()
    
    for project in personal_projects:
        activities.append(ActivityItem(
            id=f"project_{project.id}",
            type="project_created",
            title=f"Created project: {project.name}",
            workspace_name="Personal",
            workspace_slug="personal",
            workspace_type="personal",
            created_at=project.created_at.isoformat()
        ))
    
    # Get recent org projects if user is in an org
    if current_user.organization_id:
        from app.db.models import Organization
        org = db.query(Organization).filter(
            Organization.id == current_user.organization_id
        ).first()
        
        if org:
            org_projects = db.query(Project).filter(
                Project.organization_id == current_user.organization_id,
                Project.deleted_at.is_(None)
            ).order_by(Project.updated_at.desc()).limit(5).all()
            
            for project in org_projects:
                activities.append(ActivityItem(
                    id=f"project_{project.id}",
                    type="project_created",
                    title=f"Project updated: {project.name}",
                    workspace_name=org.name,
                    workspace_slug=org.slug,
                    workspace_type="organization",
                    created_at=project.updated_at.isoformat()
                ))
    
    # Sort by date and limit
    activities.sort(key=lambda x: x.created_at, reverse=True)
    activities = activities[:limit]
    
    return UserActivityResponse(activities=activities)


@router.get("/me/default-project", response_model=PersonalProjectResponse)
async def get_default_project(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the user's default personal project (Drafts).
    Used for quick start / quick draft functionality.
    Returns 404 if no default project exists.
    """
    default_project = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),
        Project.is_default == True,
        Project.deleted_at.is_(None)
    ).first()
    
    if not default_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No default project found. Create one using POST /users/me/default-project"
        )
    
    process_count = len(default_project.processes) if default_project.processes else 0
    share_count = len([s for s in default_project.shares if not s.revoked_at]) if default_project.shares else 0
    
    return PersonalProjectResponse(
        id=default_project.id,
        name=default_project.name,
        description=default_project.description,
        visibility=default_project.visibility or "private",
        process_count=process_count,
        share_count=share_count,
        tags=default_project.tags,
        created_at=default_project.created_at.isoformat(),
        updated_at=default_project.updated_at.isoformat()
    )


@router.post("/me/default-project", response_model=PersonalProjectResponse)
async def create_default_project(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create the user's default personal project (Drafts).
    Used for quick start / quick draft functionality.
    If a default project already exists, returns that one.
    """
    # Check if default project already exists
    existing_default = db.query(Project).filter(
        Project.owner_id == current_user.id,
        Project.organization_id.is_(None),
        Project.is_default == True,
        Project.deleted_at.is_(None)
    ).first()
    
    if existing_default:
        process_count = len(existing_default.processes) if existing_default.processes else 0
        share_count = len([s for s in existing_default.shares if not s.revoked_at]) if existing_default.shares else 0
        
        return PersonalProjectResponse(
            id=existing_default.id,
            name=existing_default.name,
            description=existing_default.description,
            visibility=existing_default.visibility or "private",
            process_count=process_count,
            share_count=share_count,
            tags=existing_default.tags,
            created_at=existing_default.created_at.isoformat(),
            updated_at=existing_default.updated_at.isoformat()
        )
    
    # Create the default "Drafts" project
    default_project = Project(
        name="Drafts",
        description="Quick drafts and experiments. Your personal scratch pad for process ideas.",
        tags=["drafts", "personal"],
        visibility="private",
        is_default=True,
        owner_id=current_user.id,
        created_by=current_user.id,
        organization_id=None
    )
    
    db.add(default_project)
    db.commit()
    db.refresh(default_project)
    
    return PersonalProjectResponse(
        id=default_project.id,
        name=default_project.name,
        description=default_project.description,
        visibility=default_project.visibility or "private",
        process_count=0,
        share_count=0,
        tags=default_project.tags,
        created_at=default_project.created_at.isoformat(),
        updated_at=default_project.updated_at.isoformat()
    )

