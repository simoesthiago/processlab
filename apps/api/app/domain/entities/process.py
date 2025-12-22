"""
Process Domain Entity

Pure business entity representing a BPMN process.
No database dependencies.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Process:
    """Process domain entity"""
    
    id: str
    name: str
    description: Optional[str]
    folder_id: Optional[str]
    current_version_id: Optional[str]
    position: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    @classmethod
    def create(
        cls,
        name: str,
        description: Optional[str] = None,
        folder_id: Optional[str] = None,
        position: int = 0
    ) -> "Process":
        """Factory method to create a new process"""
        now = datetime.utcnow()
        return cls(
            id="",  # Will be set by repository
            name=name,
            description=description,
            folder_id=folder_id,
            current_version_id=None,
            position=position,
            created_at=now,
            updated_at=now,
            deleted_at=None
        )
    
    def update(
        self,
        name: Optional[str] = None,
        description: Optional[str] = None,
        folder_id: Optional[str] = None,
        position: Optional[int] = None
    ) -> None:
        """Update process properties"""
        if name is not None:
            self.name = name
        if description is not None:
            self.description = description
        if folder_id is not None:
            self.folder_id = folder_id
        if position is not None:
            self.position = position
        self.updated_at = datetime.utcnow()
    
    def delete(self) -> None:
        """Soft delete the process"""
        self.deleted_at = datetime.utcnow()
    
    def is_deleted(self) -> bool:
        """Check if process is deleted"""
        return self.deleted_at is not None

