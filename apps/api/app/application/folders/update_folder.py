"""
Update Folder Use Case
"""

from typing import Optional
from app.domain.entities.folder import Folder
from app.domain.repositories.folder_repository import FolderRepository
from app.core.exceptions import ResourceNotFoundError, ValidationError


class UpdateFolderCommand:
    """Command for updating a folder"""
    
    def __init__(
        self,
        folder_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        parent_folder_id: Optional[str] = None,
        position: Optional[int] = None,
        color: Optional[str] = None,
        icon: Optional[str] = None
    ):
        self.folder_id = folder_id
        self.name = name
        self.description = description
        self.parent_folder_id = parent_folder_id
        self.position = position
        self.color = color
        self.icon = icon


class UpdateFolderUseCase:
    """Use case for updating a folder"""
    
    def __init__(self, folder_repo: FolderRepository):
        self.folder_repo = folder_repo
    
    def _validate_no_cycle(self, folder: Folder, new_parent_id: Optional[str]) -> None:
        """Ensure we never create circular references when moving folders."""
        if new_parent_id is None:
            return
        
        if new_parent_id == folder.id:
            raise ValidationError("Folder cannot be its own parent")
        
        # Check if new parent is in the subtree
        current_id = new_parent_id
        visited = set()
        while current_id:
            if current_id == folder.id:
                raise ValidationError("Cannot move folder inside its own subtree")
            if current_id in visited:
                break  # Prevent infinite loop
            visited.add(current_id)
            parent = self.folder_repo.find_by_id(current_id)
            if not parent:
                break
            current_id = parent.parent_folder_id
    
    def execute(self, command: UpdateFolderCommand) -> Folder:
        """Execute the update folder use case"""
        # Find folder
        folder = self.folder_repo.find_by_id(command.folder_id)
        if not folder:
            raise ResourceNotFoundError("Folder", command.folder_id)
        
        # Validate parent if changing
        if command.parent_folder_id is not None and command.parent_folder_id != folder.parent_folder_id:
            if command.parent_folder_id:
                parent = self.folder_repo.find_by_id(command.parent_folder_id)
                if not parent:
                    raise ResourceNotFoundError("Parent Folder", command.parent_folder_id)
            
            # Validate no cycles
            self._validate_no_cycle(folder, command.parent_folder_id)
        
        # Update folder
        folder.update(
            name=command.name,
            description=command.description,
            parent_folder_id=command.parent_folder_id,
            position=command.position,
            color=command.color,
            icon=command.icon
        )
        
        # Save to repository
        return self.folder_repo.save(folder)

