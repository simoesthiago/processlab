"""
Invitation endpoints for ProcessLab API

Handles organization invitations: create, validate, accept, list, revoke.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
import secrets
import logging

from app.db.session import get_db
from app.db.models import User, Organization, Invitation, SystemAuditLog
from app.core.auth import hash_password, create_access_token
from app.core.dependencies import get_current_user
from app.core.exceptions import ValidationError, AuthenticationError, NotFoundError, ForbiddenError
from app.schemas.governance import (
    InvitationCreate,
    InvitationResponse,
    InvitationPublicResponse,
    InvitationAcceptRequest,
    InvitationListResponse,
)
from app.schemas.auth import TokenResponse, UserResponse

logger = logging.getLogger(__name__)
router = APIRouter()


def generate_invitation_token() -> str:
    """Generate a secure random token for invitation"""
    return secrets.token_urlsafe(32)


def log_audit_event(
    db: Session,
    event_type: str,
    event_category: str,
    actor: User,
    target_type: str = None,
    target_id: str = None,
    target_email: str = None,
    details: dict = None,
    request: Request = None,
    organization_id: str = None
):
    """Helper to create audit log entries"""
    audit = SystemAuditLog(
        organization_id=organization_id or (actor.organization_id if actor else None),
        event_type=event_type,
        event_category=event_category,
        actor_user_id=actor.id if actor else None,
        actor_email=actor.email if actor else None,
        target_type=target_type,
        target_id=target_id,
        target_email=target_email,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None,
        request_id=getattr(request.state, "request_id", None) if request else None,
        details=details
    )
    db.add(audit)


@router.post("", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_invitation(
    invitation_data: InvitationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new invitation to join the organization.
    
    Only admins can create invitations.
    """
    # Check if user is admin
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can create invitations")
    
    # Check if user has an organization
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to send invitations")
    
    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    
    if not organization:
        raise NotFoundError("Organization not found")
    
    # Check if email is already a user in this organization
    existing_user = db.query(User).filter(
        and_(
            User.email == invitation_data.email,
            User.organization_id == current_user.organization_id
        )
    ).first()
    
    if existing_user:
        raise ValidationError(
            "User with this email is already a member of this organization",
            details={"email": invitation_data.email}
        )
    
    # Check for existing pending invitation
    existing_invitation = db.query(Invitation).filter(
        and_(
            Invitation.email == invitation_data.email,
            Invitation.organization_id == current_user.organization_id,
            Invitation.status == "pending"
        )
    ).first()
    
    if existing_invitation:
        # Revoke existing and create new
        existing_invitation.status = "revoked"
        logger.info(f"Revoked existing invitation for {invitation_data.email}")
    
    # Create invitation
    expires_at = datetime.utcnow() + timedelta(days=invitation_data.expires_in_days)
    
    invitation = Invitation(
        organization_id=current_user.organization_id,
        email=invitation_data.email,
        role=invitation_data.role.value,
        token=generate_invitation_token(),
        status="pending",
        expires_at=expires_at,
        invited_by=current_user.id
    )
    
    db.add(invitation)
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="invitation.created",
        event_category="user_management",
        actor=current_user,
        target_type="invitation",
        target_id=invitation.id,
        target_email=invitation_data.email,
        details={
            "role": invitation_data.role.value,
            "expires_at": expires_at.isoformat()
        },
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    db.refresh(invitation)
    
    logger.info(f"Created invitation for {invitation_data.email} to org {organization.name}")
    
    return InvitationResponse(
        id=invitation.id,
        organization_id=invitation.organization_id,
        organization_name=organization.name,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        token=invitation.token,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        invited_by=invitation.invited_by,
        inviter_name=current_user.full_name
    )


@router.get("/token/{token}", response_model=InvitationPublicResponse)
def validate_invitation(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Validate an invitation token (public endpoint).
    
    Returns invitation details if valid.
    """
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    
    if not invitation:
        raise NotFoundError("Invitation not found or invalid")
    
    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == invitation.organization_id
    ).first()
    
    if not organization:
        raise NotFoundError("Organization not found")
    
    # Get inviter
    inviter = db.query(User).filter(User.id == invitation.invited_by).first()
    
    # Check if expired
    is_valid = invitation.is_valid
    if not is_valid and invitation.status == "pending":
        # Update status to expired
        invitation.status = "expired"
        db.commit()
    
    return InvitationPublicResponse(
        id=invitation.id,
        organization_name=organization.name,
        organization_slug=organization.slug,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        is_valid=is_valid,
        expires_at=invitation.expires_at,
        inviter_name=inviter.full_name if inviter else None
    )


@router.post("/token/{token}/accept", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def accept_invitation(
    token: str,
    accept_data: InvitationAcceptRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Accept an invitation and create a new user account.
    
    Returns JWT token and user info for immediate login.
    """
    invitation = db.query(Invitation).filter(Invitation.token == token).first()
    
    if not invitation:
        raise NotFoundError("Invitation not found or invalid")
    
    if not invitation.is_valid:
        if invitation.status == "pending":
            invitation.status = "expired"
            db.commit()
        raise ValidationError(
            f"Invitation is no longer valid (status: {invitation.status})",
            details={"status": invitation.status}
        )
    
    # Check if email is already registered
    existing_user = db.query(User).filter(User.email == invitation.email).first()
    
    if existing_user:
        if existing_user.organization_id == invitation.organization_id:
            raise ValidationError("You are already a member of this organization")
        else:
            # User exists but in different org - for now, we don't support multiple orgs
            raise ValidationError(
                "An account with this email already exists. "
                "Please contact support to transfer to a different organization."
            )
    
    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == invitation.organization_id
    ).first()
    
    if not organization:
        raise NotFoundError("Organization not found")
    
    # Create user
    user = User(
        email=invitation.email,
        hashed_password=hash_password(accept_data.password),
        full_name=accept_data.full_name,
        organization_id=invitation.organization_id,
        role=invitation.role,
        is_active=True,
        is_superuser=False
    )
    
    db.add(user)
    db.flush()  # Get user ID
    
    # Update invitation
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by_user_id = user.id
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="invitation.accepted",
        event_category="user_management",
        actor=user,
        target_type="user",
        target_id=user.id,
        target_email=user.email,
        details={
            "invitation_id": invitation.id,
            "role": invitation.role,
            "organization_id": invitation.organization_id
        },
        request=request,
        organization_id=invitation.organization_id
    )
    
    db.commit()
    db.refresh(user)
    
    logger.info(f"User {user.email} accepted invitation and joined org {organization.name}")
    
    # Generate access token
    access_token = create_access_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("", response_model=InvitationListResponse)
def list_invitations(
    status: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all invitations for the current organization.
    
    Only admins can list invitations.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can view invitations")
    
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view invitations")
    
    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == current_user.organization_id
    ).first()
    
    # Build query
    query = db.query(Invitation).filter(
        Invitation.organization_id == current_user.organization_id
    )
    
    if status:
        query = query.filter(Invitation.status == status)
    
    # Get total count
    total = query.count()
    
    # Paginate
    offset = (page - 1) * page_size
    invitations = query.order_by(Invitation.created_at.desc()).offset(offset).limit(page_size).all()
    
    # Build response
    items = []
    for inv in invitations:
        inviter = db.query(User).filter(User.id == inv.invited_by).first()
        items.append(InvitationResponse(
            id=inv.id,
            organization_id=inv.organization_id,
            organization_name=organization.name if organization else None,
            email=inv.email,
            role=inv.role,
            status=inv.status,
            token=inv.token,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            accepted_at=inv.accepted_at,
            invited_by=inv.invited_by,
            inviter_name=inviter.full_name if inviter else None
        ))
    
    return InvitationListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete("/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_invitation(
    invitation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke a pending invitation.
    
    Only admins can revoke invitations.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can revoke invitations")
    
    invitation = db.query(Invitation).filter(
        and_(
            Invitation.id == invitation_id,
            Invitation.organization_id == current_user.organization_id
        )
    ).first()
    
    if not invitation:
        raise NotFoundError("Invitation not found")
    
    if invitation.status != "pending":
        raise ValidationError(f"Cannot revoke invitation with status: {invitation.status}")
    
    invitation.status = "revoked"
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="invitation.revoked",
        event_category="user_management",
        actor=current_user,
        target_type="invitation",
        target_id=invitation.id,
        target_email=invitation.email,
        details={"reason": "Admin revocation"},
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    
    logger.info(f"Invitation {invitation_id} revoked by {current_user.email}")


@router.post("/{invitation_id}/resend", response_model=InvitationResponse)
def resend_invitation(
    invitation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Resend an invitation with a new token and extended expiration.
    
    Only admins can resend invitations.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can resend invitations")
    
    invitation = db.query(Invitation).filter(
        and_(
            Invitation.id == invitation_id,
            Invitation.organization_id == current_user.organization_id
        )
    ).first()
    
    if not invitation:
        raise NotFoundError("Invitation not found")
    
    if invitation.status == "accepted":
        raise ValidationError("Cannot resend an already accepted invitation")
    
    # Get organization
    organization = db.query(Organization).filter(
        Organization.id == invitation.organization_id
    ).first()
    
    # Update invitation with new token and expiration
    invitation.token = generate_invitation_token()
    invitation.status = "pending"
    invitation.expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="invitation.resent",
        event_category="user_management",
        actor=current_user,
        target_type="invitation",
        target_id=invitation.id,
        target_email=invitation.email,
        details={"new_expires_at": invitation.expires_at.isoformat()},
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    db.refresh(invitation)
    
    logger.info(f"Invitation {invitation_id} resent by {current_user.email}")
    
    return InvitationResponse(
        id=invitation.id,
        organization_id=invitation.organization_id,
        organization_name=organization.name if organization else None,
        email=invitation.email,
        role=invitation.role,
        status=invitation.status,
        token=invitation.token,
        created_at=invitation.created_at,
        expires_at=invitation.expires_at,
        accepted_at=invitation.accepted_at,
        invited_by=invitation.invited_by,
        inviter_name=current_user.full_name
    )

