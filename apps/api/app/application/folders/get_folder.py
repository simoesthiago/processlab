"""
Get Folder Use Case
"""

from app.domain.entities.folder import Folder
from app.domain.repositories.folder_repository import FolderRepository
from app.core.exceptions import ResourceNotFoundError


class GetFolderUseCase:
    """Use case for getting a folder"""
    
    def __init__(self, folder_repo: FolderRepository):
        self.folder_repo = folder_repo
    
    def execute(self, folder_id: str) -> Folder:
        """Execute the get folder use case"""
        folder = self.folder_repo.find_by_id(folder_id)
        if not folder:
            raise ResourceNotFoundError("Folder", folder_id)
        
        return folder

