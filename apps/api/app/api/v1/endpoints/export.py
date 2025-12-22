"""
Export API - BPMN Format Conversion

Thin HTTP layer that delegates to use case.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from app.api.schemas.bpmn_operations import ExportRequest, ExportResponse
from app.core.dependencies import get_export_bpmn_use_case
from app.application.bpmn.export_bpmn import ExportBpmnUseCase, ExportBpmnCommand
import base64

router = APIRouter(tags=["export"])


@router.post("/", response_model=ExportResponse)
async def export_bpmn(
    request: ExportRequest,
    use_case: ExportBpmnUseCase = Depends(get_export_bpmn_use_case)
) -> ExportResponse:
    """
    Export BPMN to different formats.
    
    Supported formats:
    - xml: BPMN 2.0 compliant XML (for Camunda, Flowable, etc.)
    - png: Visual diagram image (not yet implemented)
    - json: Internal BPMN_JSON format
    
    The editor operates on JSON internally and converts to XML only at export time.
    This ensures the JSON schema remains the source of truth.
    """
    try:
        # Create command
        command = ExportBpmnCommand(
            bpmn_json=request.bpmn.model_dump(),
            format=request.format
        )
        
        # Execute use case
        result = use_case.execute(command)
        
        # Encode content
        content_b64 = base64.b64encode(result.content.encode()).decode()
        
        # Build filename
        process_id = request.bpmn.process.id
        extensions = {
            "xml": ".bpmn",
            "json": ".bpmn.json",
            "png": ".png"
        }
        filename = f"{process_id}{extensions.get(request.format, '')}"
        
        return ExportResponse(
            format=result.format,
            content=content_b64,
            filename=filename,
            mime_type=result.mime_type
        )
    except NotImplementedError as e:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/formats")
async def get_supported_formats():
    """
    Get list of supported export formats.
    """
    return {
        "formats": [
            {
                "id": "xml",
                "name": "BPMN 2.0 XML",
                "description": "Standard BPMN XML format for external tools",
                "mimeType": "application/xml",
                "extension": ".bpmn"
            },
            {
                "id": "png",
                "name": "PNG Image",
                "description": "Visual diagram image",
                "mimeType": "image/png",
                "extension": ".png",
                "status": "not_implemented"
            },
            {
                "id": "json",
                "name": "BPMN JSON",
                "description": "ProcessLab internal format",
                "mimeType": "application/json",
                "extension": ".bpmn.json"
            }
        ]
    }
