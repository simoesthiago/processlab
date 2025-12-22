"""
Database Models for ProcessLab

SQLAlchemy models for local-first BPMN process modeling:
- Folder: Hierarchical organization
- ProcessModel: BPMN process definitions
- ModelVersion: Version history
- Artifact: Uploaded documents
"""

from sqlalchemy import (
    Column,
    String,
    Integer,
    DateTime,
    JSON,
    ForeignKey,
    Text,
    Boolean,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


def generate_uuid():
    """Generate UUID for primary keys"""
    return str(uuid.uuid4())


# Fixed local user for single-user mode
LOCAL_USER_ID = "local-user"


class Folder(Base):
    """
    Folder
    
    Organizes processes in a hierarchical structure.
    Hierarchy: Folder → Subfolder → Process
    """
    __tablename__ = "folders"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True, default=LOCAL_USER_ID, index=True)
    parent_folder_id = Column(String(36), ForeignKey("folders.id"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Position for ordering
    position = Column(Integer, default=0)
    
    # Metadata
    color = Column(String(20), nullable=True)
    icon = Column(String(50), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    parent_folder = relationship("Folder", remote_side="Folder.id", backref="subfolders")
    processes = relationship("ProcessModel", back_populates="folder")
    
    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name})>"


class ProcessModel(Base):
    """
    BPMN Process Model
    
    Stores process definitions and their current version.
    Each process can have multiple versions (tracked in ModelVersion).
    """
    __tablename__ = "processes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    folder_id = Column(String(36), ForeignKey("folders.id"), nullable=True, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Current active version
    current_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True)
    
    # Position for ordering within folder
    position = Column(Integer, default=0)
    
    # Ownership (fixed for local-first)
    user_id = Column(String(36), nullable=True, default=LOCAL_USER_ID, index=True)
    created_by = Column(String(255), nullable=True, default=LOCAL_USER_ID)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    folder = relationship("Folder", back_populates="processes")
    versions = relationship("ModelVersion", back_populates="process", foreign_keys="ModelVersion.process_id")
    
    def __repr__(self):
        return f"<ProcessModel(id={self.id}, name={self.name})>"


class ModelVersion(Base):
    """
    BPMN Model Version
    
    Stores each version of a process model.
    Contains the BPMN_JSON data and version metadata.
    """
    __tablename__ = "model_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    process_id = Column(String(36), ForeignKey("processes.id"), nullable=False)
    
    # Versioning fields
    version_number = Column(Integer, nullable=False)
    version_label = Column(String, nullable=True)  # e.g., "v1.0", "Draft 2"
    commit_message = Column(String, nullable=True)
    change_type = Column(String, default="minor")  # major, minor, patch
    
    # Optimistic locking
    etag = Column(String(64), nullable=True)
    
    # Hierarchy
    parent_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True)
    parent_version = relationship("ModelVersion", remote_side="ModelVersion.id", backref="child_versions")
    
    # Content
    bpmn_json = Column(JSON, nullable=False)
    
    # Metadata
    generation_method = Column(String, nullable=False)  # "ai_generated", "manual_edit"
    source_artifact_ids = Column(JSON, nullable=True)
    generation_prompt = Column(String, nullable=True)
    
    # Status
    status = Column(String, default="draft")
    is_active = Column(Boolean, default=False)
    
    # Quality metrics
    quality_score = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(255), nullable=True, default=LOCAL_USER_ID)
    
    # Relationships
    process = relationship("ProcessModel", back_populates="versions", foreign_keys=[process_id])

    def __repr__(self):
        return f"<ModelVersion(id={self.id}, process_id={self.process_id}, v{self.version_number})>"


class Artifact(Base):
    """
    Uploaded Artifact (Document)
    
    Stores metadata about uploaded documents for ProcessWizard.
    Actual file content is stored in local filesystem.
    """
    __tablename__ = "artifacts"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # File metadata
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    file_size = Column(Integer, nullable=False)
    
    # Storage
    storage_path = Column(String(500), nullable=False)
    
    # Processing status
    status = Column(String(50), nullable=False, default="uploaded")
    processing_error = Column(Text, nullable=True)
    
    # Extracted content
    extracted_text = Column(Text, nullable=True)
    page_count = Column(Integer, nullable=True)
    
    # Metadata
    meta = Column(JSON, nullable=True)
    
    # Ownership
    uploaded_by = Column(String(255), nullable=True, default=LOCAL_USER_ID)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<Artifact(id={self.id}, filename={self.filename}, status={self.status})>"


class AuditEntry(Base):
    """
    Audit Trail
    
    Tracks significant actions for debugging.
    """
    __tablename__ = "audit_entries"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    
    # Event details
    event_type = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(36), nullable=False)
    
    # Changes
    changes = Column(JSON, nullable=True)
    
    # Metadata
    meta = Column(JSON, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<AuditEntry(id={self.id}, event_type={self.event_type})>"
