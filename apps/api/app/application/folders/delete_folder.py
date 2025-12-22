"""
Delete Folder Use Case
"""

from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class DeleteFolderUseCase:
    """Use case for deleting a folder (cascade delete)"""
    
    def __init__(
        self,
        folder_repo: FolderRepository,
        process_repo: ProcessRepository
    ):
        self.folder_repo = folder_repo
        self.process_repo = process_repo
    
    def _cascade_delete(self, folder_id: str) -> None:
        """Recursively delete folder and its contents"""
        # Get all child folders
        children = self.folder_repo.find_all(parent_folder_id=folder_id)
        
        # Delete child folders recursively
        for child in children:
            self._cascade_delete(child.id)
        
        # Delete processes in this folder
        processes = self.process_repo.find_all(folder_id=folder_id)
        for process in processes:
            self.process_repo.delete(process.id)
        
        # Delete the folder itself
        folder = self.folder_repo.find_by_id(folder_id)
        if folder:
            folder.delete()
            self.folder_repo.save(folder)
    
    def execute(self, folder_id: str) -> None:
        """Execute the delete folder use case"""
        # Find folder
        folder = self.folder_repo.find_by_id(folder_id)
        if not folder:
            raise ResourceNotFoundError("Folder", folder_id)
        
        # Cascade delete
        self._cascade_delete(folder_id)

