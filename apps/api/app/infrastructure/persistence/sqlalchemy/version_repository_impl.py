"""
SQLAlchemy Implementation of Version Repository
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.entities.version import ModelVersion
from app.domain.repositories.version_repository import VersionRepository
from app.db.models import ModelVersion as ModelVersionORM
from app.db.models import LOCAL_USER_ID


class SQLAlchemyVersionRepository(VersionRepository):
    """SQLAlchemy implementation of VersionRepository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _to_entity(self, orm: ModelVersionORM) -> ModelVersion:
        """Convert ORM model to domain entity"""
        return ModelVersion(
            id=orm.id,
            process_id=orm.process_id,
            version_number=orm.version_number,
            version_label=orm.version_label,
            commit_message=orm.commit_message,
            change_type=orm.change_type,
            parent_version_id=orm.parent_version_id,
            bpmn_json=orm.bpmn_json or {},
            generation_method=orm.generation_method,
            source_artifact_ids=orm.source_artifact_ids or [],
            generation_prompt=orm.generation_prompt,
            status=orm.status,
            is_active=orm.is_active,
            etag=orm.etag,
            quality_score=orm.quality_score,
            created_at=orm.created_at,
            created_by=orm.created_by or LOCAL_USER_ID
        )
    
    def _to_orm(self, entity: ModelVersion) -> ModelVersionORM:
        """Convert domain entity to ORM model"""
        if entity.id:
            # Update existing
            orm = self.db.query(ModelVersionORM).filter(
                ModelVersionORM.id == entity.id
            ).first()
            if not orm:
                raise ValueError(f"Version {entity.id} not found")
        else:
            # Create new
            orm = ModelVersionORM()
        
        orm.process_id = entity.process_id
        orm.version_number = entity.version_number
        orm.version_label = entity.version_label
        orm.commit_message = entity.commit_message
        orm.change_type = entity.change_type
        orm.parent_version_id = entity.parent_version_id
        orm.bpmn_json = entity.bpmn_json
        orm.generation_method = entity.generation_method
        orm.source_artifact_ids = entity.source_artifact_ids
        orm.generation_prompt = entity.generation_prompt
        orm.status = entity.status
        orm.is_active = entity.is_active
        orm.etag = entity.etag
        orm.quality_score = entity.quality_score
        
        return orm
    
    def find_by_id(self, version_id: str) -> Optional[ModelVersion]:
        """Find a version by ID"""
        orm = self.db.query(ModelVersionORM).filter(
            ModelVersionORM.id == version_id
        ).first()
        
        return self._to_entity(orm) if orm else None
    
    def find_by_process_id(self, process_id: str) -> List[ModelVersion]:
        """Find all versions for a process"""
        orms = self.db.query(ModelVersionORM).filter(
            ModelVersionORM.process_id == process_id
        ).order_by(ModelVersionORM.version_number.desc()).all()
        
        return [self._to_entity(orm) for orm in orms]
    
    def find_latest(self, process_id: str) -> Optional[ModelVersion]:
        """Find the latest version for a process"""
        orm = self.db.query(ModelVersionORM).filter(
            ModelVersionORM.process_id == process_id
        ).order_by(ModelVersionORM.version_number.desc()).first()
        
        return self._to_entity(orm) if orm else None
    
    def save(self, version: ModelVersion) -> ModelVersion:
        """Save or update a version"""
        orm = self._to_orm(version)
        
        if not version.id:
            # New version - generate ID
            from app.db.models import generate_uuid
            orm.id = generate_uuid()
            orm.created_by = LOCAL_USER_ID
            self.db.add(orm)
        
        self.db.commit()
        self.db.refresh(orm)
        
        # Return updated entity
        return self._to_entity(orm)
    
    def count_by_process_id(self, process_id: str) -> int:
        """Count versions for a process"""
        return self.db.query(ModelVersionORM).filter(
            ModelVersionORM.process_id == process_id
        ).count()

