"""
FastAPI Dependencies for ProcessLab API

Provides reusable dependencies for authentication, database access, etc.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.auth import get_user_id_from_token
from app.core.exceptions import AuthenticationError, AuthorizationError
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme (JWT in Authorization header)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    
    Extracts user from Authorization: Bearer <token> header.
    Validates token and retrieves user from database.
    
    Args:
        credentials: HTTP Bearer credentials from header
        db: Database session
        
    Returns:
        User object
        
    Raises:
        AuthenticationError: If token is missing, invalid, or user not found
    """
    # Check if credentials were provided
    if not credentials:
        raise AuthenticationError("Missing authentication token")
    
    # Extract token
    token = credentials.credentials
    
    # Decode token to get user ID
    user_id = get_user_id_from_token(token)
    if not user_id:
        raise AuthenticationError("Invalid or expired token")
    
    # Fetch user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AuthenticationError("User not found")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("User account is inactive")
    
    logger.debug(f"Authenticated user: {user.email} (id: {user.id})")
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get the current active user.
    Alias for get_current_user (already checks is_active).
    """
    return current_user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Optional dependency to get the current user if authenticated.
    
    Returns None if no token is provided or token is invalid.
    Used for endpoints that work with or without authentication.
    
    Args:
        credentials: HTTP Bearer credentials from header (optional)
        db: Database session
        
    Returns:
        User object if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    user_id = get_user_id_from_token(token)
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None
    
    return user


async def get_current_superuser(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to ensure the current user is a superuser.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        User object if superuser
        
    Raises:
        AuthorizationError: If user is not a superuser
    """
    if not current_user.is_superuser:
        raise AuthorizationError("Superuser privileges required")
    
    return current_user


def require_organization_access(
    user: User,
    organization_id: str,
    allow_superuser: bool = True,
    db: Session | None = None,
) -> None:
    """
    Helper to check if user has access to an organization.
    
    Args:
        user: Current user
        organization_id: Organization ID to check
        allow_superuser: If True, superusers bypass the check
        
    Raises:
        AuthorizationError: If user doesn't have access
    """
    if allow_superuser and user.is_superuser:
        return

    # Active organization shortcut
    if user.organization_id == organization_id:
        return

    # Check membership table when available (supports multi-org users)
    if db:
        from app.db.models import OrganizationMember

        membership = (
            db.query(OrganizationMember)
            .filter(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user.id,
                OrganizationMember.deleted_at.is_(None),
                OrganizationMember.status != "suspended",
            )
            .first()
        )
        if membership:
            return

    raise AuthorizationError(
        f"User does not have access to organization {organization_id}"
    )


def require_role(user: User, required_roles: list[str]) -> None:
    """
    Helper to check if user has one of the required roles.
    
    Args:
        user: Current user
        required_roles: List of acceptable roles (e.g., ["admin", "editor"])
        
    Raises:
        AuthorizationError: If user doesn't have required role
    """
    if user.is_superuser:
        return  # Superusers bypass role checks
    
    if not user.role or user.role not in required_roles:
        raise AuthorizationError(
            f"Required role: {' or '.join(required_roles)}, user has: {user.role or 'none'}"
        )
