from sqlalchemy.orm import Session
from app.db.models import Artifact, EmbeddingChunk
from app.services.ingestion.base import ParsedPage
from .embeddings import embedding_service
from typing import List
import uuid
from datetime import datetime

class IndexerService:
    def index_artifact(self, db: Session, artifact: Artifact, pages: List[ParsedPage]):
        """
        Chunks parsed pages, generates embeddings, and saves to DB.
        """
        # Clear existing chunks for this artifact if any (re-indexing)
        db.query(EmbeddingChunk).filter(EmbeddingChunk.artifact_id == artifact.id).delete()
        
        chunks = []
        chunk_index = 0
        
        for page in pages:
            text = page.text
            if not text:
                continue
                
            # Naive chunking: 1000 chars with 100 overlap
            chunk_size = 1000
            overlap = 100
            start = 0
            
            # If text is shorter than chunk size, just take it all
            if len(text) <= chunk_size:
                chunk_texts = [text]
            else:
                chunk_texts = []
                while start < len(text):
                    end = min(start + chunk_size, len(text))
                    chunk_texts.append(text[start:end])
                    start += (chunk_size - overlap)
            
            for ct in chunk_texts:
                embedding = embedding_service.get_embedding(ct)
                
                chunk = EmbeddingChunk(
                    id=str(uuid.uuid4()),
                    artifact_id=artifact.id,
                    chunk_text=ct,
                    chunk_index=chunk_index,
                    page_number=page.page_number,
                    embedding=embedding,
                    embedding_model="stub-random",
                    token_count=len(ct.split()), # Rough estimate
                    meta=page.meta
                )
                chunks.append(chunk)
                chunk_index += 1
                
        db.add_all(chunks)
        
        # Update artifact status
        artifact.chunk_count = len(chunks)
        artifact.status = "indexed"
        artifact.processed_at = datetime.utcnow()
        db.commit()

indexer_service = IndexerService()
