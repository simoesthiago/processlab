"""
Export BPMN Use Case
"""

from typing import Dict, Any
from app.infrastructure.services.bpmn.json_to_xml import to_bpmn_xml
import base64
import json


class ExportBpmnCommand:
    """Command for exporting BPMN"""
    
    def __init__(
        self,
        bpmn_json: Dict[str, Any],
        format: str  # xml, png, json
    ):
        self.bpmn_json = bpmn_json
        self.format = format


class ExportBpmnResult:
    """Result of BPMN export"""
    
    def __init__(
        self,
        content: str,
        format: str,
        mime_type: str
    ):
        self.content = content
        self.format = format
        self.mime_type = mime_type


class ExportBpmnUseCase:
    """Use case for exporting BPMN to different formats"""
    
    def execute(self, command: ExportBpmnCommand) -> ExportBpmnResult:
        """Execute the export BPMN use case"""
        if command.format == "xml":
            xml_content = to_bpmn_xml(command.bpmn_json)
            return ExportBpmnResult(
                content=xml_content,
                format="xml",
                mime_type="application/xml"
            )
        
        elif command.format == "json":
            json_content = json.dumps(command.bpmn_json, indent=2)
            return ExportBpmnResult(
                content=json_content,
                format="json",
                mime_type="application/json"
            )
        
        elif command.format == "png":
            # PNG export would require additional libraries
            # For now, return error or placeholder
            raise NotImplementedError("PNG export not yet implemented")
        
        else:
            raise ValueError(f"Unsupported export format: {command.format}")

