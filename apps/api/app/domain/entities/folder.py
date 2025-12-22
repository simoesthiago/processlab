"""
Folder Domain Entity

Pure business entity representing a folder.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Folder:
    """Folder domain entity"""
    
    id: str
    name: str
    description: Optional[str]
    parent_folder_id: Optional[str]
    position: int
    color: Optional[str]
    icon: Optional[str]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(
        cls,
        name: str,
        description: Optional[str] = None,
        parent_folder_id: Optional[str] = None,
        position: int = 0,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ) -> "Folder":
        """Factory method to create a new folder"""
        now = datetime.utcnow()
        return cls(
            id="",  # Will be set by repository
            name=name,
            description=description,
            parent_folder_id=parent_folder_id,
            position=position,
            color=color,
            icon=icon,
            created_at=now,
            updated_at=now,
            deleted_at=None
        )
    
    def update(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        parent_folder_id: Optional[str] = None,
        position: Optional[int] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ) -> None:
        """Update folder properties"""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if parent_folder_id is not None:
            self.parent_folder_id = parent_folder_id
        if position is not None:
            self.position = position
        if color is not None:
            self.color = color
        if icon is not None:
            self.icon = icon
        self.updated_at = datetime.utcnow()
    
    def delete(self) -> None:
        """Soft delete the folder"""
        self.deleted_at = datetime.utcnow()
    
    def is_deleted(self) -> bool:
        """Check if folder is deleted"""
        return self.deleted_at is not None

