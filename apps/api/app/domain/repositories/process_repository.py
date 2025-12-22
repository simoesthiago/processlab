"""
Process Repository Interface

Abstract interface for process persistence.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.process import Process


class ProcessRepository(ABC):
    """Abstract repository for Process entities"""
    
    @abstractmethod
    def find_by_id(self, process_id: str) -> Optional[Process]:
        """Find a process by ID"""
        pass
    
    @abstractmethod
    def find_all(self, folder_id: Optional[str] = None) -> List[Process]:
        """Find all processes, optionally filtered by folder"""
        pass
    
    @abstractmethod
    def save(self, process: Process) -> Process:
        """Save or update a process"""
        pass
    
    @abstractmethod
    def delete(self, process_id: str) -> None:
        """Soft delete a process"""
        pass
    
    @abstractmethod
    def exists(self, process_id: str) -> bool:
        """Check if a process exists"""
        pass

