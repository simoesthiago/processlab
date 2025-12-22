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
        
        # Get all folders recursively (find_all() only returns root folders)
        # So we need to collect all folders manually
        all_folders = []
        root_folders = self.folder_repo.find_all()  # This returns root folders only
        
        def collect_all_folders(folder_list):
            """Recursively collect all folders"""
            for folder in folder_list:
                if not folder.is_deleted():
                    all_folders.append(folder)
                    # Get children of this folder
                    children = self.folder_repo.find_all(parent_folder_id=folder.id)
                    if children:
                        collect_all_folders(children)
        
        collect_all_folders(root_folders)
        
        # Get all processes (find_all() without folder_id returns all processes)
        all_processes = self.process_repo.find_all()
        processes = [p for p in all_processes if not p.is_deleted()]
        
        # Count root folders and processes
        root_folders_count = len(root_folders)
        root_processes = [p for p in processes if p.folder_id is None]
        
        return {
            "space_id": space_id,
            "total_folders": len(all_folders),
            "total_processes": len(processes),
            "root_folders": root_folders_count,
            "root_processes": len(root_processes),
        }

