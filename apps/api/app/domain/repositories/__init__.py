"""
Repository Interfaces

Abstract interfaces for data persistence.
Implementations are in infrastructure layer.
"""

from .process_repository import ProcessRepository
from .folder_repository import FolderRepository
from .version_repository import VersionRepository

__all__ = ["ProcessRepository", "FolderRepository", "VersionRepository"]

