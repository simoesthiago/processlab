import os
import tempfile
from sqlalchemy.orm import Session
from minio import Minio
from app.core.config import settings
from app.db.models import Artifact, EmbeddingChunk
from app.services.ingestion.ocr import OCRService
from app.services.ingestion.chunking import ChunkingService
from app.services.vector.embeddings import get_embedding_service
from datetime import datetime

class IngestionPipeline:
    def __init__(self, db: Session):
        self.db = db
        self.minio_client = Minio(
            endpoint=settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.ocr_service = OCRService()
        self.chunking_service = ChunkingService()
        self.embedding_service = get_embedding_service()

    def process_artifact(self, artifact_id: str):
        artifact = self.db.query(Artifact).filter(Artifact.id == artifact_id).first()
        if not artifact:
            raise ValueError(f"Artifact {artifact_id} not found")

        try:
            artifact.status = "processing"
            self.db.commit()

            # 1. Download file
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
