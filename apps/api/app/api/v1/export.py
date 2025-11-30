"""
Export API - BPMN Format Conversion

Converts internal BPMN JSON to various export formats:
- XML: BPMN 2.0 compliant XML for external tools
- PNG: Visual diagram image
- JSON: Internal format for backup/sharing
"""

from fastapi import APIRouter, HTTPException, status
from app.schemas import ExportRequest, ExportResponse
from app.services.bpmn import json_to_xml
import base64

router = APIRouter(tags=["export"])


@router.post("/", response_model=ExportResponse)
async def export_bpmn(request: ExportRequest) -> ExportResponse:
    """
    Export BPMN to different formats.
    
    Supported formats:
    - xml: BPMN 2.0 compliant XML (for Camunda, Flowable, etc.)
    - png: Visual diagram image
    - json: Internal BPMN_JSON format
    
    The editor operates on JSON internally and converts to XML only at export time.
    This ensures the JSON schema remains the source of truth.
    
    Args:
        request: Export request with BPMN and desired format
    
    Returns:
        Exported content (base64 encoded for binary formats)
    """
    
    format_handlers = {
        "xml": _export_to_xml,
        "png": _export_to_png,
        "json": _export_to_json,
    }
    
    handler = format_handlers.get(request.format)
    if not handler:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported export format: {request.format}"
        )
    
    return handler(request)


def _export_to_xml(request: ExportRequest) -> ExportResponse:
    """
    Convert BPMN_JSON to BPMN 2.0 XML.
    
    Architecture Note:
    The editor always operates on the JSON format and converts to XML
    only at export/visualization time (cite PRD: 166).
    """
    try:
        xml_str = json_to_xml.to_bpmn_xml(request.bpmn.model_dump())
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to convert BPMN to XML: {exc}"
        )

    content_b64 = base64.b64encode(xml_str.encode()).decode()

    return ExportResponse(
        format="xml",
        content=content_b64,
        filename=f"{request.bpmn.process.id}.bpmn",
        mimeType="application/xml"
    )


def _export_to_png(request: ExportRequest) -> ExportResponse:
    """
    Render BPMN as PNG image.
    
    Uses bpmn-js or similar rendering engine.
    """
    # TODO: Implement diagram rendering
    # TODO: Use bpmn-js headless rendering or similar
    # TODO: Apply ELK.js layout before rendering
    
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="PNG export not yet implemented"
    )


def _export_to_json(request: ExportRequest) -> ExportResponse:
    """
    Export internal BPMN_JSON format.
    
    This is the native format used throughout ProcessLab.
    """
    json_str = request.bpmn.model_dump_json(indent=2)
    content_b64 = base64.b64encode(json_str.encode()).decode()
    
    process_id = request.bpmn.process.id
    
    return ExportResponse(
        format="json",
        content=content_b64,
        filename=f"{process_id}.bpmn.json",
        mimeType="application/json"
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
