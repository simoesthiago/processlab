"""
List Folders Use Case
"""

from typing import List, Optional
from app.domain.entities.folder import Folder
from app.domain.repositories.folder_repository import FolderRepository


class ListFoldersUseCase:
    """Use case for listing folders"""
    
    def __init__(self, folder_repo: FolderRepository):
        self.folder_repo = folder_repo
    
    def execute(self, parent_folder_id: Optional[str] = None) -> List[Folder]:
        """Execute the list folders use case"""
        return self.folder_repo.find_all(parent_folder_id=parent_folder_id)

