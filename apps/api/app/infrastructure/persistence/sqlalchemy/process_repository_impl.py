"""
SQLAlchemy Implementation of Process Repository
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.entities.process import Process
from app.domain.repositories.process_repository import ProcessRepository
from app.db.models import ProcessModel as ProcessModelORM
from app.db.models import LOCAL_USER_ID


class SQLAlchemyProcessRepository(ProcessRepository):
    """SQLAlchemy implementation of ProcessRepository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _to_entity(self, orm: ProcessModelORM) -> Process:
        """Convert ORM model to domain entity"""
        return Process(
            id=orm.id,
            name=orm.name,
            description=orm.description,
            folder_id=orm.folder_id,
            current_version_id=orm.current_version_id,
            position=orm.position,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
            deleted_at=orm.deleted_at
        )
    
    def _to_orm(self, entity: Process) -> ProcessModelORM:
        """Convert domain entity to ORM model"""
        if entity.id:
            # Update existing
            orm = self.db.query(ProcessModelORM).filter(
                ProcessModelORM.id == entity.id
            ).first()
            if not orm:
                raise ValueError(f"Process {entity.id} not found")
        else:
            # Create new
            orm = ProcessModelORM()
        
        orm.name = entity.name
        orm.description = entity.description
        orm.folder_id = entity.folder_id
        orm.current_version_id = entity.current_version_id
        orm.position = entity.position
        orm.deleted_at = entity.deleted_at
        
        return orm
    
    def find_by_id(self, process_id: str) -> Optional[Process]:
        """Find a process by ID"""
        orm = self.db.query(ProcessModelORM).filter(
            ProcessModelORM.id == process_id,
            ProcessModelORM.deleted_at == None,
            ProcessModelORM.user_id == LOCAL_USER_ID
        ).first()
        
        return self._to_entity(orm) if orm else None
    
    def find_all(self, folder_id: Optional[str] = None) -> List[Process]:
        """Find all processes, optionally filtered by folder"""
        query = self.db.query(ProcessModelORM).filter(
            ProcessModelORM.deleted_at == None,
            ProcessModelORM.user_id == LOCAL_USER_ID
        )
        
        if folder_id is not None:
            query = query.filter(ProcessModelORM.folder_id == folder_id)
        
        orms = query.order_by(ProcessModelORM.position, ProcessModelORM.created_at).all()
        return [self._to_entity(orm) for orm in orms]
    
    def save(self, process: Process) -> Process:
        """Save or update a process"""
        orm = self._to_orm(process)
        
        if not process.id:
            # New process - generate ID
            from app.db.models import generate_uuid
            orm.id = generate_uuid()
            orm.user_id = LOCAL_USER_ID
            orm.created_by = LOCAL_USER_ID
            self.db.add(orm)
        else:
            # Update existing
            orm.updated_at = process.updated_at
        
        self.db.commit()
        self.db.refresh(orm)
        
        # Return updated entity
        return self._to_entity(orm)
    
    def delete(self, process_id: str) -> None:
        """Soft delete a process"""
        process = self.find_by_id(process_id)
        if process:
            process.delete()
            self.save(process)
    
    def exists(self, process_id: str) -> bool:
        """Check if a process exists"""
        count = self.db.query(ProcessModelORM).filter(
            ProcessModelORM.id == process_id,
            ProcessModelORM.deleted_at == None,
            ProcessModelORM.user_id == LOCAL_USER_ID
        ).count()
        return count > 0

