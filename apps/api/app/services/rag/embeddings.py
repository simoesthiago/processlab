from typing import List
import random

class EmbeddingService:
    def __init__(self, dimension: int = 1536):
        self.dimension = dimension

    def get_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text.
        TODO: Replace with actual model (OpenAI, Cohere, etc.)
        """
        # Return random vector normalized?
        # For testing, random is fine.
        return [random.random() for _ in range(self.dimension)]

embedding_service = EmbeddingService()
