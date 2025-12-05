"""
API Key endpoints for ProcessLab API

Handles API key management: create, list, rotate, revoke.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
import secrets
import hashlib
import logging

from app.db.session import get_db
from app.db.models import User, ApiKey, SystemAuditLog
from app.core.dependencies import get_current_user
from app.core.exceptions import ValidationError, NotFoundError, ForbiddenError
from app.schemas.governance import (
    ApiKeyCreate,
    ApiKeyResponse,
    ApiKeyCreateResponse,
    ApiKeyListResponse,
    ApiKeyRotateResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()


def generate_api_key() -> str:
    """Generate a secure random API key"""
    return f"plk_{secrets.token_urlsafe(32)}"


def hash_api_key(key: str) -> str:
    """Hash an API key for storage"""
    return hashlib.sha256(key.encode()).hexdigest()


def get_key_preview(key: str) -> str:
    """Get preview of API key (last 4 characters)"""
    return f"...{key[-4:]}"


def log_audit_event(
    db: Session,
    event_type: str,
    event_category: str,
    actor: User,
    target_type: str = None,
    target_id: str = None,
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
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent", "")[:500] if request else None,
        request_id=getattr(request.state, "request_id", None) if request else None,
        details=details
    )
    db.add(audit)


@router.post("", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
def create_api_key(
    key_data: ApiKeyCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new API key.
    
    The actual key is only returned once at creation time.
    """
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to create API keys")
    
    # Generate the key
    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    key_preview = get_key_preview(raw_key)
    
    # Calculate expiration
    expires_at = None
    if key_data.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=key_data.expires_in_days)
    
    # Create API key
    api_key = ApiKey(
        organization_id=current_user.organization_id,
        user_id=current_user.id,
        name=key_data.name,
        key_type=key_data.key_type.value,
        key_hash=key_hash,
        key_preview=key_preview,
        scopes=key_data.scopes,
        expires_at=expires_at,
        is_active=True,
        usage_count=0
    )
    
    db.add(api_key)
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="api_key.created",
        event_category="security",
        actor=current_user,
        target_type="api_key",
        target_id=api_key.id,
        details={
            "name": key_data.name,
            "key_type": key_data.key_type.value,
            "scopes": key_data.scopes,
            "expires_at": expires_at.isoformat() if expires_at else None
        },
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    db.refresh(api_key)
    
    logger.info(f"API key '{key_data.name}' created by {current_user.email}")
    
    return ApiKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key_type=api_key.key_type,
        key=raw_key,  # Only returned at creation time!
        key_preview=api_key.key_preview,
        scopes=api_key.scopes,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at
    )


@router.get("", response_model=ApiKeyListResponse)
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all API keys for the current user/organization.
    
    Admins can see all organization keys, others only see their own.
    """
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view API keys")
    
    # Build query based on role
    if current_user.role == "admin":
        # Admins see all organization keys
        query = db.query(ApiKey).filter(
            ApiKey.organization_id == current_user.organization_id
        )
    else:
        # Others see only their own keys
        query = db.query(ApiKey).filter(
            and_(
                ApiKey.organization_id == current_user.organization_id,
                ApiKey.user_id == current_user.id
            )
        )
    
    # Filter out revoked keys by default, but include them for full history
    api_keys = query.order_by(ApiKey.created_at.desc()).all()
    
    items = [
        ApiKeyResponse(
            id=key.id,
            name=key.name,
            key_type=key.key_type,
            key_preview=key.key_preview,
            scopes=key.scopes,
            is_active=key.is_active and not key.revoked_at,
            last_used_at=key.last_used_at,
            usage_count=key.usage_count,
            created_at=key.created_at,
            expires_at=key.expires_at
        )
        for key in api_keys
    ]
    
    return ApiKeyListResponse(
        items=items,
        total=len(items)
    )


@router.get("/{key_id}", response_model=ApiKeyResponse)
def get_api_key(
    key_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get details of a specific API key.
    """
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view API keys")
    
    api_key = db.query(ApiKey).filter(
        and_(
            ApiKey.id == key_id,
            ApiKey.organization_id == current_user.organization_id
        )
    ).first()
    
    if not api_key:
        raise NotFoundError("API key not found")
    
    # Non-admins can only see their own keys
    if current_user.role != "admin" and api_key.user_id != current_user.id:
        raise ForbiddenError("You can only view your own API keys")
    
    return ApiKeyResponse(
        id=api_key.id,
        name=api_key.name,
        key_type=api_key.key_type,
        key_preview=api_key.key_preview,
        scopes=api_key.scopes,
        is_active=api_key.is_active and not api_key.revoked_at,
        last_used_at=api_key.last_used_at,
        usage_count=api_key.usage_count,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at
    )


@router.post("/{key_id}/rotate", response_model=ApiKeyRotateResponse)
def rotate_api_key(
    key_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rotate an API key - generates a new key and revokes the old one.
    """
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to rotate API keys")
    
    old_key = db.query(ApiKey).filter(
        and_(
            ApiKey.id == key_id,
            ApiKey.organization_id == current_user.organization_id
        )
    ).first()
    
    if not old_key:
        raise NotFoundError("API key not found")
    
    # Non-admins can only rotate their own keys
    if current_user.role != "admin" and old_key.user_id != current_user.id:
        raise ForbiddenError("You can only rotate your own API keys")
    
    if old_key.revoked_at:
        raise ValidationError("Cannot rotate a revoked key")
    
    # Generate new key
    raw_key = generate_api_key()
    key_hash = hash_api_key(raw_key)
    key_preview = get_key_preview(raw_key)
    
    # Create new API key with same settings
    new_key = ApiKey(
        organization_id=old_key.organization_id,
        user_id=old_key.user_id,
        name=old_key.name,
        key_type=old_key.key_type,
        key_hash=key_hash,
        key_preview=key_preview,
        scopes=old_key.scopes,
        expires_at=old_key.expires_at,
        is_active=True,
        usage_count=0
    )
    
    db.add(new_key)
    
    # Revoke old key
    old_key.is_active = False
    old_key.revoked_at = datetime.utcnow()
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="api_key.rotated",
        event_category="security",
        actor=current_user,
        target_type="api_key",
        target_id=old_key.id,
        details={
            "old_key_id": old_key.id,
            "new_key_id": new_key.id,
            "name": old_key.name
        },
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    db.refresh(new_key)
    
    logger.info(f"API key '{old_key.name}' rotated by {current_user.email}")
    
    return ApiKeyRotateResponse(
        old_key_id=old_key.id,
        new_key=ApiKeyCreateResponse(
            id=new_key.id,
            name=new_key.name,
            key_type=new_key.key_type,
            key=raw_key,
            key_preview=new_key.key_preview,
            scopes=new_key.scopes,
            created_at=new_key.created_at,
            expires_at=new_key.expires_at
        ),
        message="Key rotated successfully. The old key has been revoked."
    )


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Revoke an API key.
    """
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to revoke API keys")
    
    api_key = db.query(ApiKey).filter(
        and_(
            ApiKey.id == key_id,
            ApiKey.organization_id == current_user.organization_id
        )
    ).first()
    
    if not api_key:
        raise NotFoundError("API key not found")
    
    # Non-admins can only revoke their own keys
    if current_user.role != "admin" and api_key.user_id != current_user.id:
        raise ForbiddenError("You can only revoke your own API keys")
    
    if api_key.revoked_at:
        raise ValidationError("API key is already revoked")
    
    api_key.is_active = False
    api_key.revoked_at = datetime.utcnow()
    
    # Log audit event
    log_audit_event(
        db=db,
        event_type="api_key.revoked",
        event_category="security",
        actor=current_user,
        target_type="api_key",
        target_id=api_key.id,
        details={"name": api_key.name},
        request=request,
        organization_id=current_user.organization_id
    )
    
    db.commit()
    
    logger.info(f"API key '{api_key.name}' revoked by {current_user.email}")

