import os
import shutil
from pathlib import Path
from typing import BinaryIO
import logging

logger = logging.getLogger(__name__)

class LocalStorageService:
    def __init__(self, base_path: str = "/srv/data_storage"):
        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)
        # Create default bucket folders
        (self.base_path / "artifacts").mkdir(exist_ok=True)
        logger.info(f"LocalStorageService initialized at {self.base_path}")

    def upload_file(self, file_data: BinaryIO, object_name: str, bucket_name: str = "artifacts", content_type: str = None) -> str:
        """Uploads data to local filesystem."""
        try:
            target_dir = self.base_path / bucket_name
            target_dir.mkdir(exist_ok=True)
            
            target_path = target_dir / object_name
            # Ensure parent directories exist for the object
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(target_path, "wb") as f:
                shutil.copyfileobj(file_data, f)
            
            logger.info(f"File uploaded successfully to {target_path}")
            return object_name
        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            raise e

    def get_file(self, object_name: str, bucket_name: str = "artifacts"):
        """Retrieves data from local filesystem."""
        try:
            target_path = self.base_path / bucket_name / object_name
            if not target_path.exists():
                logger.error(f"File not found: {target_path}")
                return None
                
            return open(target_path, "rb")
        except Exception as e:
            logger.error(f"Error getting file: {e}")
            raise e

    def delete_file(self, object_name: str, bucket_name: str = "artifacts"):
        """Deletes file from local filesystem."""
        try:
            target_path = self.base_path / bucket_name / object_name
            if target_path.exists():
                os.remove(target_path)
        except Exception as e:
            logger.error(f"Error deleting file: {e}")
            raise e

    def get_presigned_url(self, object_name: str, bucket_name: str = "artifacts", method: str = "GET") -> str:
        """
        Returns a mock local URL. 
        In a real scenario, this would rely on Nginx serving static files or an API endpoint.
        For this demo, we'll point to an API endpoint that serves the file.
        """
        # Assuming the API has an endpoint /api/v1/files/{bucket}/{path} or similar
        # For now, we return a placeholder that the frontend might need to handle or proxy.
        # Ideally, we should add an endpoint in main.py or router to serve these files.
        return f"/api/v1/files/{bucket_name}/{object_name}"

# Singleton instance
storage_service = LocalStorageService(base_path=os.getenv("STORAGE_PATH", "/srv/data_storage"))
