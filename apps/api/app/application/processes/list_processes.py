"""
List Processes Use Case
"""

from typing import List, Optional
from app.domain.entities.process import Process
from app.domain.repositories.process_repository import ProcessRepository


class ListProcessesUseCase:
    """Use case for listing processes"""
    
    def __init__(self, process_repo: ProcessRepository):
        self.process_repo = process_repo
    
    def execute(
        self,
        folder_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Process]:
        """Execute the list processes use case"""
        processes = self.process_repo.find_all(folder_id=folder_id)
        
        # Apply search filter if provided
        if search:
            search_lower = search.lower()
            processes = [
                p for p in processes
                if search_lower in (p.name or "").lower()
                or search_lower in (p.description or "").lower()
            ]
        
        return processes

