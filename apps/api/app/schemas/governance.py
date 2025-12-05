"""
Pydantic schemas for governance endpoints (invitations, API keys, audit logs)
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# =============================================================================
# Enums
# =============================================================================

class UserRole(str, Enum):
    VIEWER = "viewer"
    EDITOR = "editor"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    REVOKED = "revoked"


class ApiKeyType(str, Enum):
    INTEGRATION = "integration"
    LLM_OPENAI = "llm_openai"
    LLM_ANTHROPIC = "llm_anthropic"
    LLM_OTHER = "llm_other"


class AuditEventCategory(str, Enum):
    USER_MANAGEMENT = "user_management"
    SECURITY = "security"
    BILLING = "billing"
    EXPORT = "export"
    ORGANIZATION = "organization"


# =============================================================================
# Invitation Schemas
# =============================================================================

class InvitationCreate(BaseModel):
    """Request schema for creating an invitation"""
    email: EmailStr = Field(..., description="Email address to invite")
    role: UserRole = Field(default=UserRole.VIEWER, description="Role to assign to the invited user")
    expires_in_days: int = Field(default=7, ge=1, le=30, description="Days until invitation expires")


class InvitationResponse(BaseModel):
    """Response schema for invitation"""
    id: str
    organization_id: str
    organization_name: Optional[str] = None
    email: str
    role: str
    status: str
    token: str
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    invited_by: str
    inviter_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class InvitationPublicResponse(BaseModel):
    """Public response for invitation validation (no sensitive data)"""
    id: str
    organization_name: str
    organization_slug: str
    email: str
    role: str
    status: str
    is_valid: bool
    expires_at: datetime
    inviter_name: Optional[str] = None


class InvitationAcceptRequest(BaseModel):
    """Request schema for accepting an invitation"""
    full_name: str = Field(..., min_length=1, description="User's full name")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")


class InvitationListResponse(BaseModel):
    """Response schema for listing invitations"""
    items: List[InvitationResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# API Key Schemas
# =============================================================================

class ApiKeyCreate(BaseModel):
    """Request schema for creating an API key"""
    name: str = Field(..., min_length=1, max_length=255, description="Name for the API key")
    key_type: ApiKeyType = Field(..., description="Type of API key")
    scopes: Optional[List[str]] = Field(None, description="Permission scopes")
    expires_in_days: Optional[int] = Field(None, ge=1, le=365, description="Days until key expires (optional)")


class ApiKeyResponse(BaseModel):
    """Response schema for API key (without the actual key)"""
    id: str
    name: str
    key_type: str
    key_preview: str  # "...xxxx"
    scopes: Optional[List[str]]
    is_active: bool
    last_used_at: Optional[datetime]
    usage_count: int
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ApiKeyCreateResponse(BaseModel):
    """Response schema for newly created API key (includes the actual key - shown only once)"""
    id: str
    name: str
    key_type: str
    key: str  # The actual API key - only shown at creation time!
    key_preview: str
    scopes: Optional[List[str]]
    created_at: datetime
    expires_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class ApiKeyListResponse(BaseModel):
    """Response schema for listing API keys"""
    items: List[ApiKeyResponse]
    total: int


class ApiKeyRotateResponse(BaseModel):
    """Response schema for rotating an API key"""
    old_key_id: str
    new_key: ApiKeyCreateResponse
    message: str = "Key rotated successfully. The old key has been revoked."


# =============================================================================
# System Audit Log Schemas
# =============================================================================

class AuditLogEntry(BaseModel):
    """Response schema for audit log entry"""
    id: str
    organization_id: Optional[str]
    event_type: str
    event_category: str
    actor_email: Optional[str]
    target_type: Optional[str]
    target_id: Optional[str]
    target_email: Optional[str]
    ip_address: Optional[str]
    details: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Response schema for listing audit logs"""
    items: List[AuditLogEntry]
    total: int
    page: int
    page_size: int


class AuditLogFilter(BaseModel):
    """Filter schema for audit log queries"""
    event_type: Optional[str] = None
    event_category: Optional[AuditEventCategory] = None
    actor_email: Optional[str] = None
    target_type: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


# =============================================================================
# Optimistic Locking Schemas
# =============================================================================

class ConflictError(BaseModel):
    """Response schema for edit conflict (409)"""
    error: str = "Edit conflict detected"
    message: str
    your_etag: str
    current_etag: str
    last_modified_by: Optional[str] = None
    last_modified_at: Optional[datetime] = None
    options: List[str] = ["overwrite", "save_as_copy", "view_diff"]

