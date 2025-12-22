"""
Get Process Use Case
"""

from app.domain.entities.process import Process
from app.domain.repositories.process_repository import ProcessRepository
from app.core.exceptions import ResourceNotFoundError


class GetProcessUseCase:
    """Use case for getting a process"""
    
    def __init__(self, process_repo: ProcessRepository):
        self.process_repo = process_repo
    
    def execute(self, process_id: str) -> Process:
        """Execute the get process use case"""
        process = self.process_repo.find_by_id(process_id)
        if not process:
            raise ResourceNotFoundError("Process", process_id)
        
        return process

