from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.rag.retriever import retriever_service
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

router = APIRouter(tags=["search"])

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    artifact_ids: Optional[List[str]] = None

class SearchResultResponse(BaseModel):
    text: str
    score: float
    artifact_id: str
    page_number: Optional[int]
    meta: Optional[Dict[str, Any]]

@router.post("/", response_model=List[SearchResultResponse])
async def search(
    request: SearchRequest,
    db: Session = Depends(get_db)
):
    """
    Semantic search over indexed artifacts.
    """
    try:
        results = retriever_service.search(
            db, 
            request.query, 
            request.limit, 
            request.artifact_ids
        )
        return [
            SearchResultResponse(
                text=r.text,
                score=r.score,
                artifact_id=r.artifact_id,
                page_number=r.page_number,
                meta=r.meta
            ) for r in results
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
