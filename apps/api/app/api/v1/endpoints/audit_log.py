"""
Audit Log endpoints for ProcessLab API

Handles viewing and exporting system audit logs.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime
from typing import Optional
import csv
import io
import json
import logging

from app.db.session import get_db
from app.db.models import User, SystemAuditLog
from app.core.dependencies import get_current_user
from app.core.exceptions import ForbiddenError, ValidationError
from app.schemas.governance import (
    AuditLogEntry,
    AuditLogListResponse,
    AuditEventCategory,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    event_category: Optional[AuditEventCategory] = Query(None, description="Filter by category"),
    actor_email: Optional[str] = Query(None, description="Filter by actor email"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List audit log entries for the organization.
    
    Only admins can view audit logs.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can view audit logs")
    
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view audit logs")
    
    # Build query
    query = db.query(SystemAuditLog).filter(
        SystemAuditLog.organization_id == current_user.organization_id
    )
    
    # Apply filters
    if event_type:
        query = query.filter(SystemAuditLog.event_type == event_type)
    
    if event_category:
        query = query.filter(SystemAuditLog.event_category == event_category.value)
    
    if actor_email:
        query = query.filter(SystemAuditLog.actor_email.ilike(f"%{actor_email}%"))
    
    if target_type:
        query = query.filter(SystemAuditLog.target_type == target_type)
    
    if start_date:
        query = query.filter(SystemAuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(SystemAuditLog.created_at <= end_date)
    
    # Get total count
    total = query.count()
    
    # Paginate
    offset = (page - 1) * page_size
    logs = query.order_by(SystemAuditLog.created_at.desc()).offset(offset).limit(page_size).all()
    
    items = [
        AuditLogEntry(
            id=log.id,
            organization_id=log.organization_id,
            event_type=log.event_type,
            event_category=log.event_category,
            actor_email=log.actor_email,
            target_type=log.target_type,
            target_id=log.target_id,
            target_email=log.target_email,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at
        )
        for log in logs
    ]
    
    return AuditLogListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/export")
def export_audit_logs(
    format: str = Query("csv", enum=["csv", "json"], description="Export format"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    event_category: Optional[AuditEventCategory] = Query(None, description="Filter by category"),
    actor_email: Optional[str] = Query(None, description="Filter by actor email"),
    start_date: Optional[datetime] = Query(None, description="Filter from date"),
    end_date: Optional[datetime] = Query(None, description="Filter to date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export audit logs as CSV or JSON.
    
    Only admins can export audit logs.
    Limited to last 10,000 entries for performance.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can export audit logs")
    
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to export audit logs")
    
    # Build query
    query = db.query(SystemAuditLog).filter(
        SystemAuditLog.organization_id == current_user.organization_id
    )
    
    # Apply filters
    if event_type:
        query = query.filter(SystemAuditLog.event_type == event_type)
    
    if event_category:
        query = query.filter(SystemAuditLog.event_category == event_category.value)
    
    if actor_email:
        query = query.filter(SystemAuditLog.actor_email.ilike(f"%{actor_email}%"))
    
    if start_date:
        query = query.filter(SystemAuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(SystemAuditLog.created_at <= end_date)
    
    # Limit to 10,000 entries
    logs = query.order_by(SystemAuditLog.created_at.desc()).limit(10000).all()
    
    # Log the export action
    export_audit = SystemAuditLog(
        organization_id=current_user.organization_id,
        event_type="audit_log.exported",
        event_category="export",
        actor_user_id=current_user.id,
        actor_email=current_user.email,
        details={
            "format": format,
            "filters": {
                "event_type": event_type,
                "event_category": event_category.value if event_category else None,
                "actor_email": actor_email,
                "start_date": start_date.isoformat() if start_date else None,
                "end_date": end_date.isoformat() if end_date else None,
            },
            "record_count": len(logs)
        }
    )
    db.add(export_audit)
    db.commit()
    
    logger.info(f"Audit log exported by {current_user.email}: {len(logs)} records")
    
    if format == "csv":
        return _export_csv(logs)
    else:
        return _export_json(logs)


def _export_csv(logs: list) -> StreamingResponse:
    """Export logs as CSV"""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID",
        "Timestamp",
        "Event Type",
        "Category",
        "Actor Email",
        "Target Type",
        "Target ID",
        "Target Email",
        "IP Address",
        "Details"
    ])
    
    # Write rows
    for log in logs:
        writer.writerow([
            log.id,
            log.created_at.isoformat(),
            log.event_type,
            log.event_category,
            log.actor_email or "",
            log.target_type or "",
            log.target_id or "",
            log.target_email or "",
            log.ip_address or "",
            json.dumps(log.details) if log.details else ""
        ])
    
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=audit_log_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        }
    )


def _export_json(logs: list) -> StreamingResponse:
    """Export logs as JSON"""
    data = [
        {
            "id": log.id,
            "timestamp": log.created_at.isoformat(),
            "event_type": log.event_type,
            "event_category": log.event_category,
            "actor_email": log.actor_email,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "target_email": log.target_email,
            "ip_address": log.ip_address,
            "details": log.details
        }
        for log in logs
    ]
    
    output = json.dumps(data, indent=2, default=str)
    
    return StreamingResponse(
        iter([output]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=audit_log_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        }
    )


@router.get("/event-types")
def list_event_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all unique event types in the audit log.
    
    Useful for building filter dropdowns.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can view audit logs")
    
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view audit logs")
    
    # Get distinct event types
    event_types = db.query(SystemAuditLog.event_type).filter(
        SystemAuditLog.organization_id == current_user.organization_id
    ).distinct().all()
    
    return {
        "event_types": [et[0] for et in event_types],
        "event_categories": [ec.value for ec in AuditEventCategory]
    }


@router.get("/{log_id}", response_model=AuditLogEntry)
def get_audit_log_entry(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific audit log entry with full details.
    """
    if current_user.role != "admin":
        raise ForbiddenError("Only admins can view audit logs")
    
    if not current_user.organization_id:
        raise ValidationError("You must belong to an organization to view audit logs")
    
    log = db.query(SystemAuditLog).filter(
        and_(
            SystemAuditLog.id == log_id,
            SystemAuditLog.organization_id == current_user.organization_id
        )
    ).first()
    
    if not log:
        raise HTTPException(status_code=404, detail="Audit log entry not found")
    
    return AuditLogEntry(
        id=log.id,
        organization_id=log.organization_id,
        event_type=log.event_type,
        event_category=log.event_category,
        actor_email=log.actor_email,
        target_type=log.target_type,
        target_id=log.target_id,
        target_email=log.target_email,
        ip_address=log.ip_address,
        details=log.details,
        created_at=log.created_at
    )

