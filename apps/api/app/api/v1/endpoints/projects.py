"""
Project endpoints for ProcessLab API

Handles project management within organizations.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.db.session import get_db
from app.db.models import User, Project, ProcessModel
from app.core.dependencies import get_current_user, require_organization_access, require_role
from app.schemas.auth import ProjectCreate, ProjectUpdate, ProjectResponse
from app.core.exceptions import ResourceNotFoundError, AuthorizationError, ValidationError
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    organization_id: Optional[str] = Query(None, description="Filter by organization ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List projects.
    
    - If organization_id provided, lists projects in that organization
    - Otherwise, lists projects in user's organization
    - Superusers can see all projects if no filter
    """
    # Determine which organization to query
    if organization_id:
        # Check access to specified organization
        require_organization_access(current_user, organization_id)
        filter_org_id = organization_id
    elif current_user.organization_id:
        # Use user's organization
        filter_org_id = current_user.organization_id
    elif current_user.is_superuser:
        # Superuser without org sees all
        filter_org_id = None
    else:
        # User has no organization
        return []
    
    # Build query
    query = db.query(
        Project,
        func.count(ProcessModel.id).label('process_count')
    ).outerjoin(
        ProcessModel,
        (ProcessModel.project_id == Project.id) & (ProcessModel.deleted_at == None)
    ).filter(
        Project.deleted_at == None
    )
    
    if filter_org_id:
        query = query.filter(Project.organization_id == filter_org_id)
    
    query = query.group_by(Project.id)
    
    results = query.all()
    
    # Build response
    projects = []
    for project, process_count in results:
        project_dict = ProjectResponse.from_orm(project).dict()
        project_dict['process_count'] = process_count
        projects.append(ProjectResponse(**project_dict))
    
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific project.
    
    Requires user to be member of the project's organization.
    """
    # Fetch project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()
    
    if not project:
        raise ResourceNotFoundError("Project", project_id)
    
    # Check access
    require_organization_access(current_user, project.organization_id)
    
    # Get process count
    process_count = db.query(func.count(ProcessModel.id)).filter(
        ProcessModel.project_id == project_id,
        ProcessModel.deleted_at == None
    ).scalar()
    
    project_dict = ProjectResponse.from_orm(project).dict()
    project_dict['process_count'] = process_count
    
    return ProjectResponse(**project_dict)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new project.
    
    Requires user to be member of the organization with editor or admin role.
    """
    # Check access to organization
    require_organization_access(current_user, project_data.organization_id)
    
    # Check role (viewer cannot create projects)
    require_role(current_user, ["editor", "admin"])
    
    # Create project
    project = Project(
        organization_id=project_data.organization_id,
        name=project_data.name,
        description=project_data.description,
        tags=project_data.tags,
        created_by=current_user.id
    )
    
    db.add(project)
    db.commit()
    db.refresh(project)
    
    logger.info(f"Created project: {project.name} (id: {project.id}) by user {current_user.email}")
    
    project_dict = ProjectResponse.from_orm(project).dict()
    project_dict['process_count'] = 0
    
    return ProjectResponse(**project_dict)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a project.
    
    Requires user to be member of the organization with editor or admin role.
    """
    # Fetch project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()
    
    if not project:
        raise ResourceNotFoundError("Project", project_id)
    
    # Check access
    require_organization_access(current_user, project.organization_id)
    require_role(current_user, ["editor", "admin"])
    
    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.tags is not None:
        project.tags = project_data.tags
    
    db.commit()
    db.refresh(project)
    
    logger.info(f"Updated project: {project.name} (id: {project.id})")
    
    # Get process count
    process_count = db.query(func.count(ProcessModel.id)).filter(
        ProcessModel.project_id == project_id,
        ProcessModel.deleted_at == None
    ).scalar()
    
    project_dict = ProjectResponse.from_orm(project).dict()
    project_dict['process_count'] = process_count
    
    return ProjectResponse(**project_dict)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a project (soft delete).
    
    Requires user to be admin of the organization.
    Note: Does NOT delete associated processes (they remain orphaned for safety).
    """
    # Fetch project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at == None
    ).first()
    
    if not project:
        raise ResourceNotFoundError("Project", project_id)
    
    # Check access
    require_organization_access(current_user, project.organization_id)
    require_role(current_user, ["admin"])
    
    # Soft delete
    from datetime import datetime
    project.deleted_at = datetime.utcnow()
    
    db.commit()
    
    logger.info(f"Deleted project: {project.name} (id: {project.id})")
    
    return None
