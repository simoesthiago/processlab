"""
Update Process Use Case
"""

from typing import Optional
from app.domain.entities.process import Process
from app.domain.repositories.process_repository import ProcessRepository
from app.domain.repositories.folder_repository import FolderRepository
from app.core.exceptions import ResourceNotFoundError


class UpdateProcessCommand:
    """Command for updating a process"""
    
    def __init__(
        self,
        process_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        folder_id: Optional[str] = None,
        position: Optional[int] = None
    ):
        self.process_id = process_id
        self.name = name
        self.description = description
        self.folder_id = folder_id
        self.position = position


class UpdateProcessUseCase:
    """Use case for updating a process"""
    
    def __init__(
        self,
        process_repo: ProcessRepository,
        folder_repo: FolderRepository
    ):
        self.process_repo = process_repo
        self.folder_repo = folder_repo
    
    def execute(self, command: UpdateProcessCommand) -> Process:
        """Execute the update process use case"""
        # Find process
        process = self.process_repo.find_by_id(command.process_id)
        if not process:
            raise ResourceNotFoundError("Process", command.process_id)
        
        # Validate folder if changing
        if command.folder_id is not None and command.folder_id != process.folder_id:
            if command.folder_id:
                folder = self.folder_repo.find_by_id(command.folder_id)
                if not folder:
                    raise ResourceNotFoundError("Folder", command.folder_id)
        
        # Update process
        process.update(
            name=command.name,
            description=command.description,
            folder_id=command.folder_id,
            position=command.position
        )
        
        # Save to repository
        return self.process_repo.save(process)

