import os
import tempfile
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.models import Artifact, EmbeddingChunk
from app.services.ingestion.ocr import OCRService
from app.services.ingestion.chunking import ChunkingService
from app.services.vector.embeddings import get_embedding_service
from app.services.storage.local import storage_service
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class IngestionPipeline:
    def __init__(self):
        self.storage = storage_service
        self.ocr_service = OCRService()
        self.chunking_service = ChunkingService()
        self.embedding_service = get_embedding_service()

    async def process_document(self, object_name: str, db: Session):
        """
        Process a document from storage > extraction > embedding.
        Async wrapper for local execution.
        """
        logger.info(f"Processing document: {object_name}")

        artifact = db.query(Artifact).filter(Artifact.storage_path == object_name).first()
        if not artifact:
            raise ValueError(f"Artifact with storage path {object_name} not found")

        try:
            artifact.status = "processing"
            _, ext = os.path.splitext(artifact.filename or "")
            if not ext:
                 _, ext = os.path.splitext(artifact.storage_path)

            with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_file:
                self.minio_client.fget_object(
                    bucket_name=artifact.storage_bucket,
                    object_name=artifact.storage_path,
                    file_path=tmp_file.name
                )
                file_path = tmp_file.name

            # 2. Extract Text (OCR/Parsing)
            text = self.ocr_service.extract_text_from_file(file_path)
            os.unlink(file_path)  # Cleanup temp file

            if not text:
                raise ValueError("No text extracted from file")

            # 3. Chunking
            chunks = self.chunking_service.chunk_text(text)

            # 4. Embeddings
            embeddings = self.embedding_service.get_embeddings(chunks)

            # 5. Save Chunks
            for i, (chunk_text, embedding) in enumerate(zip(chunks, embeddings)):
                chunk = EmbeddingChunk(
                    artifact_id=artifact.id,
                    chunk_text=chunk_text,
                    chunk_index=i,
                    embedding=embedding,
                    embedding_model=settings.EMBEDDING_MODEL,
                    token_count=len(chunk_text.split()) # Rough estimate
                )
                self.db.add(chunk)

            # 6. Update Artifact
            artifact.status = "ready"
            artifact.chunk_count = len(chunks)
            artifact.processed_at = datetime.utcnow()
            self.db.commit()

        except Exception as e:
            artifact.status = "failed"
            artifact.processing_error = str(e)
            self.db.commit()
            raise e
