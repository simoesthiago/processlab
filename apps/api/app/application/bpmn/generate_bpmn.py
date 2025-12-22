"""
Generate BPMN Use Case
"""

from typing import List, Optional, Dict, Any
from app.domain.entities.process import Process
from app.domain.entities.version import ModelVersion
from app.domain.repositories.process_repository import ProcessRepository
from app.domain.repositories.folder_repository import FolderRepository
from app.domain.repositories.version_repository import VersionRepository
from app.core.exceptions import ResourceNotFoundError
from app.infrastructure.services.ai.pipeline import generate_process
from app.infrastructure.services.bpmn.json_to_xml import to_bpmn_xml


class GenerateBpmnCommand:
    """Command for generating BPMN"""
    
    def __init__(
        self,
        artifact_ids: List[str],
        process_name: str,
        folder_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ):
        self.artifact_ids = artifact_ids
        self.process_name = process_name
        self.folder_id = folder_id
        self.options = options or {}


class GenerateBpmnResult:
    """Result of BPMN generation"""
    
    def __init__(
        self,
        bpmn_json: Dict[str, Any],
        preview_xml: str,
        process: Optional[Process] = None,
        version: Optional[ModelVersion] = None,
        metrics: Optional[Dict[str, Any]] = None
    ):
        self.bpmn_json = bpmn_json
        self.preview_xml = preview_xml
        self.process = process
        self.version = version
        self.metrics = metrics or {}


class GenerateBpmnUseCase:
    """Use case for generating BPMN from artifacts"""
    
    def __init__(
        self,
        process_repo: ProcessRepository,
        folder_repo: FolderRepository,
        version_repo: VersionRepository
    ):
        self.process_repo = process_repo
        self.folder_repo = folder_repo
        self.version_repo = version_repo
    
    async def execute(self, command: GenerateBpmnCommand) -> GenerateBpmnResult:
        """Execute the generate BPMN use case"""
        # Validate folder if provided
        if command.folder_id:
            folder = self.folder_repo.find_by_id(command.folder_id)
            if not folder:
                raise ResourceNotFoundError("Folder", command.folder_id)
        
        # Prepare context for AI pipeline
        context = {
            "artifacts": command.artifact_ids,
            "process_name": command.process_name
        }
        
        # Generate BPMN using AI pipeline
        result = await generate_process(
            artifact_ids=command.artifact_ids,
            options=command.options
        )
        
        if result.get("status") == "error":
            raise Exception(result.get("error", "Failed to generate BPMN"))
        
        bpmn_json_data = result["json"]
        preview_xml = result.get("xml") or to_bpmn_xml(bpmn_json_data)
        
        # Create process and version
        process = Process.create(
            name=command.process_name,
            description=f"Generated from artifacts: {', '.join(command.artifact_ids)}",
            folder_id=command.folder_id
        )
        
        saved_process = self.process_repo.save(process)
        
        # Create version
        from app.application.versioning.create_version import CreateVersionCommand, CreateVersionUseCase
        create_version_use_case = CreateVersionUseCase(self.version_repo, self.process_repo)
        
        version_command = CreateVersionCommand(
            process_id=saved_process.id,
            bpmn_json=bpmn_json_data,
            generation_method="ai_generated",
            source_artifact_ids=command.artifact_ids,
            generation_prompt=f"Generate {command.process_name}",
            is_active=True
        )
        
        saved_version = create_version_use_case.execute(version_command)
        
        return GenerateBpmnResult(
            bpmn_json=bpmn_json_data,
            preview_xml=preview_xml,
            process=saved_process,
            version=saved_version,
            metrics=result.get("metrics", {})
        )

