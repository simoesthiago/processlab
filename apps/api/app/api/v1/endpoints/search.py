from fastapi import APIRouter
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
async def search(request: SearchRequest):
    """
    Semantic search over indexed artifacts.
    (Disabled in local-first mode)
    """
    return []
