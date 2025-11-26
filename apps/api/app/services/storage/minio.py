import os
import io
from minio import Minio
from minio.error import S3Error
import logging

logger = logging.getLogger(__name__)

class MinIOService:
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        # Handle http/https prefix if present, Minio client expects endpoint without protocol
        endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
        if endpoint.startswith("http://"):
            endpoint = endpoint.replace("http://", "")
            secure = False
        elif endpoint.startswith("https://"):
            endpoint = endpoint.replace("https://", "")
            secure = True
        else:
            secure = False

        self.client = Minio(
            endpoint=endpoint,
            access_key=os.getenv("MINIO_ACCESS_KEY", "minio"),
            secret_key=os.getenv("MINIO_SECRET_KEY", "minio123"),
            secure=secure
        )
        self.bucket_name = os.getenv("MINIO_BUCKET", "artifacts")
        self._initialized = True
        
    def _ensure_bucket(self):
        try:
            if not self.client.bucket_exists(bucket_name=self.bucket_name):
                self.client.make_bucket(bucket_name=self.bucket_name)
                logger.info(f"Created bucket: {self.bucket_name}")
        except S3Error as e:
            logger.warning(f"Error checking/creating bucket (will retry on first use): {e}")            # Don't raise here to allow app to start even if MinIO is temporarily down

    def put_object(self, object_name: str, data: bytes, content_type: str) -> str:
        """Uploads data to MinIO and returns the object name."""
        try:
            self._ensure_bucket()  # Ensure bucket exists on first use
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type
            )
            return object_name
        except S3Error as e:
            logger.error(f"Error uploading object {object_name}: {e}")
            raise

    def get_object(self, object_name: str) -> bytes:
        """Retrieves data from MinIO."""
        try:
            response = self.client.get_object(bucket_name=self.bucket_name, object_name=object_name)
            try:
                return response.read()
            finally:
                response.close()
        except S3Error as e:
            logger.error(f"Error getting object {object_name}: {e}")
            raise

# Create singleton instance (but don't initialize MinIO connection yet)
storage_service = MinIOService()
