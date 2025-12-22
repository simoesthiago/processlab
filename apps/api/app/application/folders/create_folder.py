"""
Create Folder Use Case
"""

from typing import Optional
from app.domain.entities.folder import Folder
from app.domain.repositories.folder_repository import FolderRepository
from app.core.exceptions import ResourceNotFoundError


class CreateFolderCommand:
    """Command for creating a folder"""
    
    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        parent_folder_id: Optional[str] = None,
        position: int = 0,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ):
        self.name = name
        self.description = description
        self.parent_folder_id = parent_folder_id
        self.position = position
        self.color = color
        self.icon = icon


class CreateFolderUseCase:
    """Use case for creating a folder"""
    
    def __init__(self, folder_repo: FolderRepository):
        self.folder_repo = folder_repo
    
    def execute(self, command: CreateFolderCommand) -> Folder:
        """Execute the create folder use case"""
        # Validate parent folder if provided
        if command.parent_folder_id:
            parent = self.folder_repo.find_by_id(command.parent_folder_id)
            if not parent:
                raise ResourceNotFoundError("Parent Folder", command.parent_folder_id)
        
        # Create folder entity
        folder = Folder.create(
            name=command.name,
            description=command.description,
            parent_folder_id=command.parent_folder_id,
            position=command.position,
            color=command.color,
            icon=command.icon
        )
        
        # Save to repository
        return self.folder_repo.save(folder)

