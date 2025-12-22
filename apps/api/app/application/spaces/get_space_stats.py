"""
Get Space Stats Use Case
"""

from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ValidationError


class GetSpaceStatsUseCase:
    """Use case for getting space statistics"""
    
    def __init__(
        self,
        folder_repo: FolderRepository,
        process_repo: ProcessRepository
    ):
        self.folder_repo = folder_repo
        self.process_repo = process_repo
    
    def execute(self, space_id: str):
        """Execute the get space stats use case"""
        if space_id != "private":
            raise ValidationError("Only private space is supported")
        
        # Count folders and processes
        folders = self.folder_repo.find_all()
        processes = self.process_repo.find_all()
        
        folder_count = len([f for f in folders if not f.is_deleted])
        process_count = len([p for p in processes if not p.is_deleted])
        
        return {
            "folder_count": folder_count,
            "process_count": process_count,
            "total_versions": 0,  # TODO: Add version count if needed
        }

