"""
Delete Process Use Case
"""

from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class DeleteProcessUseCase:
    """Use case for deleting a process"""
    
    def __init__(self, process_repo: ProcessRepository):
        self.process_repo = process_repo
    
    def execute(self, process_id: str) -> None:
        """Execute the delete process use case"""
        # Find process
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        # Soft delete
        process.delete()
        self.process_repo.save(process)

