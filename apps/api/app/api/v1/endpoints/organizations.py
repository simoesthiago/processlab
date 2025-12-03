"""
Organization endpoints for ProcessLab API

Handles organization management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.db.models import User, Organization
from app.core.dependencies import get_current_user, require_organization_access
from app.schemas.auth import OrganizationResponse, OrganizationCreate
from app.core.exceptions import ResourceNotFoundError, AuthorizationError
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List organizations accessible to the current user.
    
    - Regular users see only their organization
    - Superusers see all organizations
    """
    if current_user.is_superuser:
        # Superusers can see all organizations
        organizations = db.query(Organization).filter(
            Organization.deleted_at == None
        ).all()
    elif current_user.organization_id:
        # Regular users see only their organization
        organizations = db.query(Organization).filter(
            Organization.id == current_user.organization_id,
            Organization.deleted_at == None
        ).all()
    else:
        # User has no organization
        organizations = []
    
    return [OrganizationResponse.from_orm(org) for org in organizations]


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization(
    organization_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific organization.
    
    Requires user to be member of the organization or superuser.
    """
    # Check access
    require_organization_access(current_user, organization_id)
    
    # Fetch organization
    organization = db.query(Organization).filter(
        Organization.id == organization_id,
        Organization.deleted_at == None
    ).first()
    
    if not organization:
        raise ResourceNotFoundError("Organization", organization_id)
    
    return OrganizationResponse.from_orm(organization)


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    org_data: OrganizationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new organization.
    
    Only superusers can create organizations.
    Regular users create organization during registration.
    """
    if not current_user.is_superuser:
        raise AuthorizationError("Only superusers can create organizations directly")
    
    # Check if name is already taken
    existing = db.query(Organization).filter(
        Organization.name == org_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Organization with name '{org_data.name}' already exists"
        )
    
    # Create organization
    organization = Organization(
        name=org_data.name,
        description=org_data.description
    )
    
    db.add(organization)
    db.commit()
    db.refresh(organization)
    
    logger.info(f"Created organization: {organization.name} (id: {organization.id})")
    
    return OrganizationResponse.from_orm(organization)
