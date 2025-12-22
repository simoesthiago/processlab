"""
Folder Repository Interface

Abstract interface for folder persistence.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.folder import Folder


class FolderRepository(ABC):
    """Abstract repository for Folder entities"""
    
    @abstractmethod
    def find_by_id(self, folder_id: str) -> Optional[Folder]:
        """Find a folder by ID"""
        pass
    
    @abstractmethod
    def find_all(self, parent_folder_id: Optional[str] = None) -> List[Folder]:
        """Find all folders, optionally filtered by parent"""
        pass
    
    @abstractmethod
    def save(self, folder: Folder) -> Folder:
        """Save or update a folder"""
        pass
    
    @abstractmethod
    def delete(self, folder_id: str) -> None:
        """Soft delete a folder"""
        pass
    
    @abstractmethod
    def exists(self, folder_id: str) -> bool:
        """Check if a folder exists"""
        pass

