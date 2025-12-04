"""
Database Models for ProcessLab

SQLAlchemy models for:
- ProcessModel: BPMN process versions
- ModelVersion: Version history and metadata
- Artifact: Uploaded documents
- EmbeddingChunk: RAG vector chunks
- AuditEntry: Audit trail

TODO (Sprint 2+):
- Implement full model methods
- Add relationships and constraints
- Create indexes for performance
"""

from sqlalchemy import Column, String, Integer, DateTime, JSON, LargeBinary, ForeignKey, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    """Generate UUID for primary keys"""
    return str(uuid.uuid4())


class Organization(Base):
    """
    Organization (Multi-tenant)
    
    Represents a company or consultancy client.
    All data is scoped by organization for multi-tenancy.
    """
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, unique=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Settings
    settings = Column(JSON, nullable=True)  # Organization-specific settings
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    projects = relationship("Project", back_populates="organization")
    users = relationship("User", back_populates="organization")
    
    def __repr__(self):
        return f"<Organization(id={self.id}, name={self.name}, slug={self.slug})>"


class Project(Base):
    """
    Project
    
    Groups related processes together within an organization or as personal projects.
    Hierarchy: Organization → Project → Process → Version
    
    For personal projects: organization_id is NULL, owner_id is set
    For org projects: organization_id is set, owner_id can be NULL
    """
    __tablename__ = "projects"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)  # NULL for personal projects
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Metadata
    tags = Column(JSON, nullable=True)  # e.g., ["finance", "compliance"]
    settings = Column(JSON, nullable=True)  # Project-specific settings
    
    # Visibility for personal projects
    visibility = Column(String(20), nullable=True, default="organization")  # private, shared, public, organization
    
    # Ownership
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # For personal projects
    created_by = Column(String(255), nullable=True)  # User ID who created it
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="projects")
    owner = relationship("User", back_populates="owned_projects", foreign_keys=[owner_id])
    processes = relationship("ProcessModel", back_populates="project")
    shares = relationship("ProjectShare", back_populates="project")
    
    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name}, org_id={self.organization_id}, owner_id={self.owner_id})>"



class ProcessModel(Base):
    """
    BPMN Process Model
    
    Stores process definitions and their current version.
    Each process can have multiple versions (tracked in ModelVersion).
    Belongs to a Project within an Organization.
    """
    __tablename__ = "processes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Current active version
    current_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True)
    
    # Ownership
    created_by = Column(String(255), nullable=True)  # User ID from auth system
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)  # Denormalized for easy filtering
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="processes")
    versions = relationship("ModelVersion", back_populates="process", foreign_keys="ModelVersion.process_id")
    
    def __repr__(self):
        return f"<ProcessModel(id={self.id}, name={self.name}, project_id={self.project_id})>"



class ModelVersion(Base):
    """
    BPMN Model Version
    
    Stores each version of a process model.
    Contains the BPMN_JSON data and quality metrics.
    """
    __tablename__ = "model_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    process_id = Column(String(36), ForeignKey("processes.id"), nullable=False)
    
    # Versioning fields
    version_number = Column(Integer, nullable=False)
    version_label = Column(String, nullable=True)  # e.g., "v1.0", "Draft 2"
    commit_message = Column(String, nullable=True)  # Git-style commit message
    change_type = Column(String, default="minor")  # major, minor, patch
    
    # Hierarchy
    parent_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True)
    parent_version = relationship("ModelVersion", remote_side="ModelVersion.id", backref="child_versions")
    
    # Content
    bpmn_json = Column(JSON, nullable=False)
    
    # Metadata
    generation_method = Column(String, nullable=False)  # "ai_generated", "manual_edit"
    source_artifact_ids = Column(JSON, nullable=True)  # List of artifact IDs used
    generation_prompt = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="draft")  # draft, ready, archived
    is_active = Column(Boolean, default=False)  # Only one active version per process
    
    # Quality metrics (GED/RGED)
    quality_score = Column(Integer, nullable=True)  # 0-100
    ged_score = Column(Integer, nullable=True)  # Graph Edit Distance
    rged_score = Column(Integer, nullable=True)  # Relative GED
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    process = relationship("ProcessModel", back_populates="versions", foreign_keys=[process_id])
    artifacts = relationship("Artifact", secondary="model_version_artifacts", backref="model_versions")

    def __repr__(self):
        return f"<ModelVersion(id={self.id}, process_id={self.process_id}, v{self.version_number})>"


class ModelVersionArtifact(Base):
    """
    Association table between ModelVersion and Artifact.
    Tracks which artifacts were used to generate a specific model version.
    """
    __tablename__ = "model_version_artifacts"

    model_version_id = Column(String(36), ForeignKey("model_versions.id"), primary_key=True)
    artifact_id = Column(String(36), ForeignKey("artifacts.id"), primary_key=True)
    
    # Optional: store relevance score or specific usage context
    relevance_score = Column(Integer, nullable=True) 
    
    def __repr__(self):
        return f"<ModelVersionArtifact(model_version_id={self.model_version_id}, artifact_id={self.artifact_id})>"


class Artifact(Base):
    """
    Uploaded Artifact (Document)
    
    Stores metadata about uploaded documents.
    Actual file content is stored in object storage (MinIO/S3).
    """
    __tablename__ = "artifacts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # File metadata
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)  # bytes
    
    # Storage
    storage_path = Column(String(500), nullable=False)  # S3/MinIO path
    storage_bucket = Column(String(100), nullable=False, default="artifacts")
    
    # Processing status
    status = Column(String(50), nullable=False, default="uploaded")  # uploaded, processing, ready, failed
    processing_error = Column(Text, nullable=True)
    
    # RAG processing
    chunk_count = Column(Integer, nullable=True, default=0)  # Number of embedding chunks
    processed_at = Column(DateTime, nullable=True)
    
    # Metadata
    meta = Column(JSON, nullable=True)  # Extra info (pages, language, etc.)
    
    # Ownership
    uploaded_by = Column(String(255), nullable=True)
    organization_id = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Artifact(id={self.id}, filename={self.filename}, status={self.status})>"


class EmbeddingChunk(Base):
    """
    RAG Embedding Chunk
    
    Stores text chunks and their vector embeddings for RAG retrieval.
    Uses pgvector extension for similarity search.
    """
    __tablename__ = "embedding_chunks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    artifact_id = Column(String(36), ForeignKey("artifacts.id"), nullable=False)
    
    # Chunk content
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Position in document
    page_number = Column(Integer, nullable=True)  # For PDFs
    
    # Embedding (pgvector)
    embedding = Column(Vector(1536), nullable=True)  # OpenAI ada-002 dimension
    # embedding_json = Column(JSON, nullable=True)  # Temporary: store as JSON array
    
    # Metadata
    embedding_model = Column(String(100), nullable=True)  # e.g., "text-embedding-ada-002"
    token_count = Column(Integer, nullable=True)
    meta = Column(JSON, nullable=True)  # Extra info
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<EmbeddingChunk(id={self.id}, artifact_id={self.artifact_id}, chunk_index={self.chunk_index})>"


class AuditEntry(Base):
    """
    Audit Trail
    
    Tracks all significant actions for compliance and debugging.
    Security note: NEVER log API keys or sensitive data.
    """
    __tablename__ = "audit_entries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # "process.created", "artifact.uploaded", etc.
    resource_type = Column(String(50), nullable=False)  # "process", "artifact", "version"
    resource_id = Column(String(36), nullable=False)
    
    # Actor
    user_id = Column(String(255), nullable=True)
    organization_id = Column(String(36), nullable=True)
    
    # Request context
    request_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(255), nullable=True)
    
    # Changes (before/after snapshots)
    changes = Column(JSON, nullable=True)
    
    # Metadata
    meta = Column(JSON, nullable=True)  # Additional context
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<AuditEntry(id={self.id}, event_type={self.event_type}, resource_id={self.resource_id})>"



class User(Base):
    """
    User
    
    Application users who belong to an organization.
    Can also have personal projects.
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Organization membership
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    # Status and role
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    role = Column(String(50), nullable=True)  # "viewer", "editor", "admin"
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    owned_projects = relationship("Project", back_populates="owner", foreign_keys="Project.owner_id")
    shared_projects = relationship("ProjectShare", back_populates="shared_with_user", foreign_keys="ProjectShare.shared_with_user_id")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, org_id={self.organization_id})>"


class ProjectShare(Base):
    """
    Project Share
    
    Manages sharing of personal projects with other users.
    Supports both direct user sharing and public link sharing.
    """
    __tablename__ = "project_shares"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False, index=True)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Who it's shared with (mutually exclusive with public link)
    shared_with_email = Column(String(255), nullable=True)  # Email for pending invites
    shared_with_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Public link sharing
    share_token = Column(String(64), unique=True, nullable=True, index=True)
    is_public_link = Column(Boolean, default=False)
    
    # Permission level
    permission = Column(String(20), nullable=False)  # "viewer", "commenter", "editor"
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete / revocation
    revoked_at = Column(DateTime, nullable=True)
    
    # Relationships
    project = relationship("Project", back_populates="shares")
    owner = relationship("User", foreign_keys=[owner_id])
    shared_with_user = relationship("User", back_populates="shared_projects", foreign_keys=[shared_with_user_id])
    
    def __repr__(self):
        return f"<ProjectShare(id={self.id}, project_id={self.project_id}, permission={self.permission})>"
    
    @property
    def is_valid(self):
        """Check if the share is still valid (not expired or revoked)"""
        if self.revoked_at:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True


