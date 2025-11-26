from sqlalchemy.orm import Session
from app.db.models import EmbeddingChunk
from .embeddings import embedding_service
from typing import List, Optional, Any
from dataclasses import dataclass

@dataclass
class SearchResult:
    text: str
    score: float
    artifact_id: str
    page_number: int
    meta: dict

class RetrieverService:
    def search(self, db: Session, query: str, limit: int = 5, artifact_ids: Optional[List[str]] = None) -> List[SearchResult]:
        query_vec = embedding_service.get_embedding(query)
        
        # Select chunk and distance
        distance_col = EmbeddingChunk.embedding.cosine_distance(query_vec).label("distance")
        stmt = db.query(EmbeddingChunk, distance_col).order_by(distance_col)
        
        if artifact_ids:
            stmt = stmt.filter(EmbeddingChunk.artifact_id.in_(artifact_ids))
            
        results_tuples = stmt.limit(limit).all()
        
        results = []
        for chunk, distance in results_tuples:
            # Convert distance to similarity score (0 to 1)
            # Cosine distance is 0..2 (0=identical, 1=orthogonal, 2=opposite)
            # Similarity = 1 - distance
            score = 1 - distance
            
            results.append(SearchResult(
                text=chunk.chunk_text,
                score=score,
                artifact_id=chunk.artifact_id,
                page_number=chunk.page_number,
                meta=chunk.meta or {}
            ))
            
        return results

retriever_service = RetrieverService()
