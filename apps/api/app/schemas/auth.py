"""
Pydantic schemas for authentication endpoints
"""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional


class UserRegisterRequest(BaseModel):
    """Request schema for user registration"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")
    full_name: str = Field(..., min_length=1, description="User's full name")
    organization_name: Optional[str] = Field(None, description="Organization name (creates new org if provided)")


class UserLoginRequest(BaseModel):
    """Request schema for user login"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class TokenResponse(BaseModel):
    """Response schema for login/token endpoints"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: "UserResponse" = Field(..., description="User information")


class UserResponse(BaseModel):
    """Response schema for user information"""
    id: str
    email: str
    full_name: Optional[str]
    organization_id: Optional[str]
    role: Optional[str]
    is_active: bool
    is_superuser: bool
    
    class Config:
        from_attributes = True


class OrganizationCreate(BaseModel):
    """Request schema for creating an organization"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class OrganizationResponse(BaseModel):
    """Response schema for organization"""
    id: str
    name: str
    description: Optional[str]
    created_at: str
    
    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    """Request schema for creating a project"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    organization_id: str = Field(..., description="Organization ID")
    tags: Optional[list[str]] = None


class ProjectUpdate(BaseModel):
    """Request schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[list[str]] = None


class ProjectResponse(BaseModel):
    """Response schema for project"""
    id: str
    # Personal projects have no organization
    organization_id: Optional[str] = None
    name: str
    description: Optional[str]
    tags: Optional[list[str]]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    process_count: Optional[int] = Field(None, description="Number of processes in project")
    
    model_config = ConfigDict(from_attributes=True)


class ProcessResponse(BaseModel):
    """Response schema for process (basic info)"""

    id: str
    project_id: Optional[str] = None
    folder_id: Optional[str] = Field(None, description="Folder containing the process (optional)")
    # Personal/private processes carry user_id, team processes carry organization_id
    organization_id: Optional[str] = None
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
