"""
SQLAlchemy Implementation of Folder Repository
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from app.domain.entities.folder import Folder
from app.domain.repositories.folder_repository import FolderRepository
from app.db.models import Folder as FolderORM
from app.db.models import LOCAL_USER_ID


class SQLAlchemyFolderRepository(FolderRepository):
    """SQLAlchemy implementation of FolderRepository"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def _to_entity(self, orm: FolderORM) -> Folder:
        """Convert ORM model to domain entity"""
        return Folder(
            id=orm.id,
            name=orm.name,
            description=orm.description,
            parent_folder_id=orm.parent_folder_id,
            position=orm.position,
            color=orm.color,
            icon=orm.icon,
            created_at=orm.created_at,
            updated_at=orm.updated_at,
            deleted_at=orm.deleted_at
        )
    
    def _to_orm(self, entity: Folder) -> FolderORM:
        """Convert domain entity to ORM model"""
        if entity.id:
            # Update existing
            orm = self.db.query(FolderORM).filter(
                FolderORM.id == entity.id
            ).first()
            if not orm:
                raise ValueError(f"Folder {entity.id} not found")
        else:
            # Create new
            orm = FolderORM()
        
        orm.name = entity.name
        orm.description = entity.description
        orm.parent_folder_id = entity.parent_folder_id
        orm.position = entity.position
        orm.color = entity.color
        orm.icon = entity.icon
        orm.deleted_at = entity.deleted_at
        
        return orm
    
    def find_by_id(self, folder_id: str) -> Optional[Folder]:
        """Find a folder by ID"""
        orm = self.db.query(FolderORM).filter(
            FolderORM.id == folder_id,
            FolderORM.deleted_at == None,
            FolderORM.user_id == LOCAL_USER_ID
        ).first()
        
        return self._to_entity(orm) if orm else None
    
    def find_all(self, parent_folder_id: Optional[str] = None) -> List[Folder]:
        """Find all folders, optionally filtered by parent"""
        query = self.db.query(FolderORM).filter(
            FolderORM.deleted_at == None,
            FolderORM.user_id == LOCAL_USER_ID
        )
        
        if parent_folder_id is not None:
            query = query.filter(FolderORM.parent_folder_id == parent_folder_id)
        else:
            # If None explicitly passed, get root folders
            query = query.filter(FolderORM.parent_folder_id == None)
        
        orms = query.order_by(FolderORM.position, FolderORM.created_at).all()
        return [self._to_entity(orm) for orm in orms]
    
    def save(self, folder: Folder) -> Folder:
        """Save or update a folder"""
        orm = self._to_orm(folder)
        
        if not folder.id:
            # New folder - generate ID
            from app.db.models import generate_uuid
            orm.id = generate_uuid()
            orm.user_id = LOCAL_USER_ID
            self.db.add(orm)
        else:
            # Update existing
            orm.updated_at = folder.updated_at
        
        self.db.commit()
        self.db.refresh(orm)
        
        # Return updated entity
        return self._to_entity(orm)
    
    def delete(self, folder_id: str) -> None:
        """Soft delete a folder"""
        folder = self.find_by_id(folder_id)
        if folder:
            folder.delete()
            self.save(folder)
    
    def exists(self, folder_id: str) -> bool:
        """Check if a folder exists"""
        count = self.db.query(FolderORM).filter(
            FolderORM.id == folder_id,
            FolderORM.deleted_at == None,
            FolderORM.user_id == LOCAL_USER_ID
        ).count()
        return count > 0

