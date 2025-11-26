from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import Artifact
from app.services.storage.minio import storage_service
from app.services.ingestion.factory import ParserFactory
from app.services.rag.indexer import indexer_service
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def process_artifact(artifact_id: str):
    """
    Orchestrates the processing of an artifact:
    1. Download from Storage
    2. Parse content
    3. Index (Chunk + Embed + Save)
    """
    db = SessionLocal()
    try:
        artifact = db.query(Artifact).filter(Artifact.id == artifact_id).first()
        if not artifact:
            logger.error(f"Artifact {artifact_id} not found")
            return

        logger.info(f"Processing artifact {artifact_id} ({artifact.filename})")
        artifact.status = "processing"
        db.commit()

        # 1. Download from MinIO
        try:
            content = storage_service.get_object(artifact.storage_path)
        except Exception as e:
            logger.error(f"Failed to download artifact: {e}")
            artifact.status = "error"
            artifact.processing_error = f"Download failed: {str(e)}"
            db.commit()
            return

        # 2. Parse
        try:
            parser = ParserFactory.get_parser(artifact.mime_type)
            pages = parser.parse(content, artifact.filename)
        except Exception as e:
            logger.error(f"Failed to parse artifact: {e}")
            artifact.status = "error"
            artifact.processing_error = f"Parsing failed: {str(e)}"
            db.commit()
            return

        # 3. Index
        try:
            indexer_service.index_artifact(db, artifact, pages)
        except Exception as e:
            logger.error(f"Failed to index artifact: {e}")
            artifact.status = "error"
            artifact.processing_error = f"Indexing failed: {str(e)}"
            db.commit()
            return

        logger.info(f"Successfully processed artifact {artifact_id}")

    except Exception as e:
        logger.error(f"Unexpected error processing artifact {artifact_id}: {e}")
        # Try to update status if possible
        try:
            if 'artifact' in locals() and artifact:
                artifact.status = "error"
                artifact.processing_error = f"Unexpected error: {str(e)}"
                db.commit()
        except:
            pass
    finally:
        db.close()
