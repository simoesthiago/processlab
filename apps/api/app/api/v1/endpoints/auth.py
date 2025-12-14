"""
Authentication endpoints for ProcessLab API

Handles user registration, login, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.auth import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.schemas.auth import (
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse
)
from app.core.exceptions import ValidationError, AuthenticationError
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserRegisterRequest,
    db: Session = Depends(get_db)
):
    """
    Register a new user.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise ValidationError(
            "User with this email already exists",
            details={"email": user_data.email}
        )
    
    # Create user
    user = User(
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_superuser=False
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    logger.info(f"Registered user: {user.email} (id: {user.id})")
    
    # Generate access token
    access_token = create_access_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
def login_user(
    login_data: UserLoginRequest,
    db: Session = Depends(get_db)
):
    """
    Login with email and password.
    
    Returns JWT access token and user information.
    """
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email).first()
    
    # Verify user exists and password is correct
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise AuthenticationError("Incorrect email or password")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("User account is inactive")
    
    logger.info(f"User logged in: {user.email}")
    
    # Generate access token
    access_token = create_access_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Get current user information from JWT token.
    
    Protected endpoint that requires authentication.
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout")
def logout_user():
    """
    Logout endpoint.
    
    Note: JWT tokens are stateless, so logout is handled client-side
    by discarding the token. This endpoint exists for consistency
    and can be extended with token blacklisting if needed.
    """
    return {"message": "Logged out successfully. Please discard your token."}

