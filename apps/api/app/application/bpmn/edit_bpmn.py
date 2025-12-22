"""
Edit BPMN Use Case
"""

from typing import Dict, Any, Optional
from app.domain.entities.version import ModelVersion
from app.domain.repositories.version_repository import VersionRepository
from app.core.exceptions import ResourceNotFoundError
from app.infrastructure.services.bpmn.patch import BpmnPatchService
from app.infrastructure.services.ai.linter import BpmnLinter


class EditBpmnCommand:
    """Command for editing BPMN"""
    
    def __init__(
        self,
        current_bpmn_json: Dict[str, Any],
        patch: Dict[str, Any],
        if_match: Optional[str] = None
    ):
        self.current_bpmn_json = current_bpmn_json
        self.patch = patch
        self.if_match = if_match


class EditBpmnResult:
    """Result of BPMN edit"""
    
    def __init__(
        self,
        updated_bpmn_json: Dict[str, Any],
        change_description: str,
        lint_errors: Optional[list] = None
    ):
        self.updated_bpmn_json = updated_bpmn_json
        self.change_description = change_description
        self.lint_errors = lint_errors or []


class EditBpmnUseCase:
    """Use case for editing BPMN using natural language"""
    
    def __init__(
        self,
        version_repo: VersionRepository
    ):
        self.version_repo = version_repo
        self.patch_service = BpmnPatchService()
        self.linter = BpmnLinter()
    
    def execute(self, command: EditBpmnCommand) -> EditBpmnResult:
        """Execute the edit BPMN use case"""
        # Check optimistic locking
        if command.if_match:
            # Compute etag from current BPMN
            import json
            import hashlib
            serialized = json.dumps(command.current_bpmn_json or {}, sort_keys=True, separators=(",", ":"))
            current_etag = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
            
            if command.if_match != current_etag:
                from app.api.governance import ConflictError
                raise ConflictError(
                    message="Process changed since you started editing.",
                    your_etag=command.if_match,
                    current_etag=current_etag
                )
        
        # Convert dict to BPMNJSON for patch service
        from app.api import BPMNJSON
        current_bpmn = BPMNJSON(**command.current_bpmn_json)
        
        # Apply patch using patch service
        updated_bpmn = self.patch_service.apply_patch(current_bpmn, command.patch)
        updated_json = updated_bpmn.model_dump()
        
        # Lint the updated BPMN
        lint_results = self.linter.lint(updated_json)
        lint_errors = [r for r in lint_results if r.get("severity") == "error"]
        
        # Generate change description
        change_description = f"Applied patch: {command.patch.get('op', 'unknown')}"
        
        return EditBpmnResult(
            updated_bpmn_json=updated_json,
            change_description=change_description,
            lint_errors=lint_errors
        )

