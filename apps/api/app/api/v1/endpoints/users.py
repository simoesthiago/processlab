"""
Users API Endpoints

Handles user-specific resources like stats and activity.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.db.session import get_db
from app.db.models import User, ProcessModel
from app.core.dependencies import get_current_user

router = APIRouter()


class UserStatsResponse(BaseModel):
    process_count: int


class ActivityItem(BaseModel):
    id: str
    type: str # process_created, process_updated
    title: str
    workspace_name: str = "Private Space"
    created_at: str


class UserActivityResponse(BaseModel):
    activities: List[ActivityItem]


@router.get("/me/stats", response_model=UserStatsResponse)
def get_my_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get statistics for the current user (Private Space).
    """
    # Count processes in private space
    process_count = db.query(ProcessModel).filter(
        ProcessModel.user_id == current_user.id,
        ProcessModel.deleted_at == None
    ).count()
    
    return UserStatsResponse(
        process_count=process_count
    )


@router.get("/me/activity", response_model=UserActivityResponse)
def get_my_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent activity for the current user.
    """
    activities = []
    
    # Get recent processes
    processes = db.query(ProcessModel).filter(
        ProcessModel.user_id == current_user.id,
        ProcessModel.deleted_at == None
    ).order_by(ProcessModel.updated_at.desc()).limit(limit).all()
    
    for process in processes:
        activities.append(ActivityItem(
            id=f"process_{process.id}",
            type="process_updated",
            title=f"Updated process: {process.name}",
            workspace_name="Private Space",
            created_at=process.updated_at.isoformat()
        ))
    
    return UserActivityResponse(activities=activities)


