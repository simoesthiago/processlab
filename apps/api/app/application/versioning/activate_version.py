"""
Activate Version Use Case
"""

from app.domain.repositories.version_repository import VersionRepository
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class ActivateVersionUseCase:
    """Use case for activating a version"""
    
    def __init__(
        self,
        version_repo: VersionRepository,
        process_repo: ProcessRepository
    ):
        self.version_repo = version_repo
        self.process_repo = process_repo
    
    def execute(self, process_id: str, version_id: str):
        """Execute the activate version use case"""
        # Validate process exists
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        # Get version
        version = self.version_repo.find_by_id(version_id)
        if not version or version.process_id != process_id:
            raise ResourceNotFoundError("Version", version_id)
        
        # Update process current_version_id
        process.current_version_id = version_id
        self.process_repo.save(process)
        
        return {
            "message": "Version activated successfully",
            "process_id": process_id,
            "version_id": version_id,
            "version_number": version.version_number
        }

