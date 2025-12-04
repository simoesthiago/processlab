"""
Shares API Endpoints

Handles project sharing and share token validation.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
import secrets

from app.db.session import get_db
from app.db.models import User, Project, ProjectShare
from app.api.deps import get_current_user_optional, get_current_user

router = APIRouter()


# Pydantic models
class ShareValidationResponse(BaseModel):
    project_id: str
    project_name: str
    project_description: Optional[str]
    owner_name: str
    permission: str
    is_public_link: bool
    process_id: Optional[str] = None


class CreateShareRequest(BaseModel):
    project_id: str
    permission: str = "viewer"  # viewer, commenter, editor
    shared_with_email: Optional[str] = None
    is_public_link: bool = False
    expires_in_days: Optional[int] = None


class ShareResponse(BaseModel):
    id: str
    project_id: str
    permission: str
    share_token: Optional[str]
    share_url: Optional[str]
    is_public_link: bool
    shared_with_email: Optional[str]
    expires_at: Optional[str]
    created_at: str


class ShareListResponse(BaseModel):
    shares: list[ShareResponse]
    total_count: int


@router.get("/{token}/validate", response_model=ShareValidationResponse)
async def validate_share_token(
    token: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Validate a share token and return project info.
    Public links don't require authentication.
    Non-public links require the user to be the share recipient.
    """
    share = db.query(ProjectShare).filter(
        ProjectShare.share_token == token,
        ProjectShare.revoked_at.is_(None)
    ).first()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found or has been revoked"
        )
    
    # Check expiration
    if share.expires_at and share.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="This share link has expired"
        )
    
    # For non-public links, verify the user
    if not share.is_public_link:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required to access this share"
            )
        
        # Check if user is the intended recipient
        if share.shared_with_user_id and share.shared_with_user_id != current_user.id:
            if share.shared_with_email and share.shared_with_email != current_user.email:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have access to this share"
                )
    
    project = share.project
    owner = share.owner
    
    if not project or project.deleted_at:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The shared project no longer exists"
        )
    
    # Get the first process ID if exists
    process_id = None
    if project.processes:
        active_process = next((p for p in project.processes if not p.deleted_at), None)
        if active_process:
            process_id = active_process.id
    
    return ShareValidationResponse(
        project_id=project.id,
        project_name=project.name,
        project_description=project.description,
        owner_name=owner.full_name or owner.email if owner else "Unknown",
        permission=share.permission,
        is_public_link=share.is_public_link,
        process_id=process_id
    )


@router.post("", response_model=ShareResponse)
async def create_share(
    share_data: CreateShareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new share for a personal project.
    Only the project owner can create shares.
    """
    # Verify project exists and user owns it
    project = db.query(Project).filter(
        Project.id == share_data.project_id,
        Project.deleted_at.is_(None)
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only share your own projects"
        )
    
    # Validate permission
    if share_data.permission not in ['viewer', 'commenter', 'editor']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid permission level"
        )
    
    # Generate share token
    share_token = secrets.token_urlsafe(32)
    
    # Calculate expiration
    expires_at = None
    if share_data.expires_in_days:
        from datetime import timedelta
        expires_at = datetime.utcnow() + timedelta(days=share_data.expires_in_days)
    
    # Find user by email if provided
    shared_with_user_id = None
    if share_data.shared_with_email and not share_data.is_public_link:
        shared_user = db.query(User).filter(
            User.email == share_data.shared_with_email
        ).first()
        if shared_user:
            shared_with_user_id = shared_user.id
    
    # Create share
    share = ProjectShare(
        project_id=project.id,
        owner_id=current_user.id,
        share_token=share_token,
        permission=share_data.permission,
        is_public_link=share_data.is_public_link,
        shared_with_email=share_data.shared_with_email if not share_data.is_public_link else None,
        shared_with_user_id=shared_with_user_id,
        expires_at=expires_at
    )
    
    db.add(share)
    
    # Update project visibility
    if project.visibility == 'private':
        project.visibility = 'shared'
    
    db.commit()
    db.refresh(share)
    
    # Generate share URL
    base_url = "http://localhost:3000"  # TODO: Get from config
    share_url = f"{base_url}/share/{share_token}"
    
    return ShareResponse(
        id=share.id,
        project_id=share.project_id,
        permission=share.permission,
        share_token=share_token,
        share_url=share_url,
        is_public_link=share.is_public_link,
        shared_with_email=share.shared_with_email,
        expires_at=share.expires_at.isoformat() if share.expires_at else None,
        created_at=share.created_at.isoformat()
    )


@router.get("/project/{project_id}", response_model=ShareListResponse)
async def get_project_shares(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all shares for a project.
    Only the project owner can view shares.
    """
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.deleted_at.is_(None)
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view shares for your own projects"
        )
    
    shares = db.query(ProjectShare).filter(
        ProjectShare.project_id == project_id,
        ProjectShare.revoked_at.is_(None)
    ).order_by(ProjectShare.created_at.desc()).all()
    
    base_url = "http://localhost:3000"  # TODO: Get from config
    
    share_list = []
    for share in shares:
        share_list.append(ShareResponse(
            id=share.id,
            project_id=share.project_id,
            permission=share.permission,
            share_token=share.share_token,
            share_url=f"{base_url}/share/{share.share_token}" if share.share_token else None,
            is_public_link=share.is_public_link,
            shared_with_email=share.shared_with_email,
            expires_at=share.expires_at.isoformat() if share.expires_at else None,
            created_at=share.created_at.isoformat()
        ))
    
    return ShareListResponse(
        shares=share_list,
        total_count=len(share_list)
    )


@router.delete("/{share_id}")
async def revoke_share(
    share_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke a share.
    Only the project owner can revoke shares.
    """
    share = db.query(ProjectShare).filter(
        ProjectShare.id == share_id
    ).first()
    
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share not found"
        )
    
    if share.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only revoke your own shares"
        )
    
    share.revoked_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Share revoked successfully"}

