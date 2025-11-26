from app.core.celery_app import celery_app
from app.db.session import SessionLocal
from app.services.ingestion.pipeline import IngestionPipeline
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def ingest_artifact_task(self, artifact_id: str):
    logger.info(f"Starting ingestion for artifact: {artifact_id}")
    db = SessionLocal()
    try:
        pipeline = IngestionPipeline(db)
        pipeline.process_artifact(artifact_id)
        logger.info(f"Successfully processed artifact: {artifact_id}")
    except Exception as e:
        logger.error(f"Error processing artifact {artifact_id}: {e}")
        # Retry on failure
        raise self.retry(exc=e)
    finally:
        db.close()
