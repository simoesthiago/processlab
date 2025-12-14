"""
Pydantic schemas for authentication and user endpoints
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional


class UserRegisterRequest(BaseModel):
    """Request schema for user registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    full_name: str = Field(..., min_length=1, description="User's full name")


class UserLoginRequest(BaseModel):
    """Request schema for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """Response schema for user information"""
    id: str
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Response schema for login/token endpoints"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(..., description="User information")


class ProcessResponse(BaseModel):
    """Response schema for process (basic info)"""

    id: str
    folder_id: Optional[str] = Field(None, description="Folder containing the process (optional)")
    # Personal/private processes carry user_id
    user_id: Optional[str] = None
    name: str
    description: Optional[str]
    current_version_id: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    version_count: Optional[int] = Field(None, description="Number of versions")
    status: Optional[str] = Field(None, description="Process status (derived from active version)")

    model_config = ConfigDict(from_attributes=True)

