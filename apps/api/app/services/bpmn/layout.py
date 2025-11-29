"""
BPMN Layout Service

In Sprint 4, the actual layout calculation is performed by ELK.js on the frontend.
This service is a placeholder/stub that can be used to mark models as "needs_layout"
or to integrate a backend layout engine in the future.
"""

from app.schemas import BPMNJSON

class BpmnLayoutService:
    def apply_layout(self, bpmn: BPMNJSON) -> BPMNJSON:
        """
        Apply automatic layout to the BPMN model.
        
        For Sprint 4, this is a no-op on the backend as we rely on frontend ELK.js.
        However, we could add a flag to metadata indicating layout is stale.
        """
        # TODO: Implement backend layout or integration with ELK service if needed.
        # For now, return as is.
        return bpmn
