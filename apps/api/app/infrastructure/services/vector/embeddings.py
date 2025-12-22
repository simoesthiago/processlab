from abc import ABC, abstractmethod
from typing import List
import openai
from sentence_transformers import SentenceTransformer
from app.core.config import settings

class EmbeddingService(ABC):
    @abstractmethod
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        pass

class OpenAIEmbeddingService(EmbeddingService):
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.EMBEDDING_MODEL

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        # OpenAI handles batching, but for very large lists we might want to chunk manually
        # For now, assuming reasonable batch sizes
        response = self.client.embeddings.create(input=texts, model=self.model)
        return [data.embedding for data in response.data]

class HuggingFaceEmbeddingService(EmbeddingService):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        embeddings = self.model.encode(texts)
        return embeddings.tolist()

def get_embedding_service() -> EmbeddingService:
    if settings.OPENAI_API_KEY:
        return OpenAIEmbeddingService()
    return HuggingFaceEmbeddingService()
