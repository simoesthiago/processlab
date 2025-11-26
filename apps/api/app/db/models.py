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


class ProcessModel(Base):
    """
    BPMN Process Model
    
    Stores process definitions and their current version.
    Each process can have multiple versions (tracked in ModelVersion).
    """
    __tablename__ = "processes"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Current active version
    current_version_id = Column(String(36), ForeignKey("model_versions.id"), nullable=True)
    
    # Ownership
    created_by = Column(String(255), nullable=True)  # User ID from auth system
    organization_id = Column(String(36), nullable=True)  # For multi-tenancy
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Soft delete
    deleted_at = Column(DateTime, nullable=True)
    
    # Relationships
    versions = relationship("ModelVersion", back_populates="process", foreign_keys="ModelVersion.process_id")
    
    def __repr__(self):
        return f"<ProcessModel(id={self.id}, name={self.name})>"


class ModelVersion(Base):
    """
    BPMN Model Version
    
    Stores each version of a process model.
    Contains the BPMN_JSON data and quality metrics.
    """
    __tablename__ = "model_versions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    process_id = Column(String(36), ForeignKey("processes.id"), nullable=False)
    
    # Version info
    version_number = Column(Integer, nullable=False)  # Auto-incrementing per process
    version_label = Column(String(50), nullable=True)  # e.g., "v1", "draft", "final"
    
    # BPMN data (stored as JSON)
    bpmn_json = Column(JSON, nullable=False)  # BPMN_JSON format
    
    # Generation metadata
    generation_method = Column(String(50), nullable=True)  # "ai_generated", "manual", "edited"
    source_artifact_ids = Column(JSON, nullable=True)  # List of artifact IDs used
    generation_prompt = Column(Text, nullable=True)
    
    # Quality metrics (GED/RGED)
    quality_score = Column(Integer, nullable=True)  # 0-100
    ged_score = Column(Integer, nullable=True)  # Graph Edit Distance
    rged_score = Column(Integer, nullable=True)  # Relative GED
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(255), nullable=True)
    
    # Relationships
    process = relationship("ProcessModel", back_populates="versions", foreign_keys=[process_id])
    
    def __repr__(self):
        return f"<ModelVersion(id={self.id}, process_id={self.process_id}, v{self.version_number})>"


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
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"

