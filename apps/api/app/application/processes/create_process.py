"""
Create Process Use Case
"""

from typing import Optional
from app.domain.entities.process import Process
from app.domain.repositories.process_repository import ProcessRepository
from app.domain.repositories.folder_repository import FolderRepository
from app.core.exceptions import ResourceNotFoundError


class CreateProcessCommand:
    """Command for creating a process"""
    
    def __init__(
        self,
        name: str,
        description: Optional[str] = None,
        folder_id: Optional[str] = None,
        position: int = 0
    ):
        self.name = name
        self.description = description
        self.folder_id = folder_id
        self.position = position


class CreateProcessUseCase:
    """Use case for creating a new process"""
    
    def __init__(
        self,
        process_repo: ProcessRepository,
        folder_repo: FolderRepository
    ):
        self.process_repo = process_repo
        self.folder_repo = folder_repo
    
    def execute(self, command: CreateProcessCommand) -> Process:
        """Execute the create process use case"""
        # Validate folder exists if provided
        if command.folder_id:
            folder = self.folder_repo.find_by_id(command.folder_id)
            if not folder:
                raise ResourceNotFoundError("Folder", command.folder_id)
        
        # Create process entity
        process = Process.create(
            name=command.name,
            description=command.description,
            folder_id=command.folder_id,
            position=command.position
        )
        
        # Save to repository
        return self.process_repo.save(process)

