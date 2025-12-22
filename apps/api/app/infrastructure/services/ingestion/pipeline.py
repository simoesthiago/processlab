
import logging
from sqlalchemy.orm import Session
from app.db.models import Artifact
# Removed EmbeddingChunk and other complex services for local-first simplification

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def __init__(self):
        # Stub services, or just don't initialize anything
        pass

    async def process_document(self, object_name: str, db: Session):
        """
        Simplified ingestion pipeline for local mode.
        Basically validates the artifact exists and marks it as ready.
        OCR and Extraction will be re-added in future PRs if needed.
        """
        logger.info(f"Processing document (stub): {object_name}")

        artifact = db.query(Artifact).filter(Artifact.storage_path == object_name).first()
        if not artifact:
            logger.error(f"Artifact with storage path {object_name} not found")
            return

        try:
            # For now, just mark as ready immediately.
            # Local file is already saved by the endpoint.
            artifact.status = "ready"
            # artifact.chunk_count = 0 
            # artifact.processed_at = datetime.utcnow()
            
            db.commit()
            logger.info(f"Artifact {artifact.id} marked as ready")

        except Exception as e:
            logger.error(f"Error in stub ingestion pipeline: {e}")
            artifact.status = "failed"
            artifact.processing_error = str(e)
            db.commit()
