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
    # Check for demo mode/token
    is_demo = False
    if not credentials:
        # In local demo, we might want to default to trusted if no header
        # or require at least "Bearer demo-token"
        pass
    
    token = credentials.credentials if credentials else "demo-token"
    
    if token == "demo-token":
        # Demo Mode: Get or create default user
        user = db.query(User).filter(User.email == "demo@processlab.io").first()
        if not user:
            from app.core.security import get_password_hash
            user = User(
                email="demo@processlab.io",
                hashed_password=get_password_hash("demo"),
                full_name="Demo User",
                is_active=True,
                is_superuser=True,
                # organization_id="demo-org" # REMOVED
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # Standard JWT flow
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



