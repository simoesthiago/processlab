"""
Version Repository Interface

Abstract interface for version persistence.
"""

from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.entities.version import ModelVersion


class VersionRepository(ABC):
    """Abstract repository for ModelVersion entities"""
    
    @abstractmethod
    def find_by_id(self, version_id: str) -> Optional[ModelVersion]:
        """Find a version by ID"""
        pass
    
    @abstractmethod
    def find_by_process_id(self, process_id: str) -> List[ModelVersion]:
        """Find all versions for a process"""
        pass
    
    @abstractmethod
    def find_latest(self, process_id: str) -> Optional[ModelVersion]:
        """Find the latest version for a process"""
        pass
    
    @abstractmethod
    def save(self, version: ModelVersion) -> ModelVersion:
        """Save or update a version"""
        pass
    
    @abstractmethod
    def count_by_process_id(self, process_id: str) -> int:
        """Count versions for a process"""
        pass

