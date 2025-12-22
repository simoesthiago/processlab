from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ParsedPage:
    text: str
    page_number: int
    meta: Dict[str, Any] = None

class BaseParser(ABC):
    @abstractmethod
    def parse(self, content: bytes, filename: str) -> List[ParsedPage]:
        """Parse document content into pages/chunks."""
        pass
