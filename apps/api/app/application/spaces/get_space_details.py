"""
Get Space Details Use Case
"""

from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class GetSpaceDetailsUseCase:
    """Use case for getting space details"""
    
    def __init__(
        self,
        folder_repo: FolderRepository,
        process_repo: ProcessRepository
    ):
        self.folder_repo = folder_repo
        self.process_repo = process_repo
    
    def execute(self, space_id: str):
        """Execute the get space details use case"""
        if space_id != "private":
            raise ResourceNotFoundError("Space", space_id)
        
        # Count folders and processes
        folders = self.folder_repo.find_all()
        processes = self.process_repo.find_all()
        
        folder_count = len([f for f in folders if not f.is_deleted])
        process_count = len([p for p in processes if not p.is_deleted])
        
        return {
            "id": "private",
            "name": "Private Space",
            "description": "Your personal space",
            "type": "private",
            "folder_count": folder_count,
            "process_count": process_count,
        }

