from typing import List
from .base import BaseParser, ParsedPage

class TextParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> List[ParsedPage]:
        try:
            text = content.decode("utf-8")
            return [ParsedPage(
                text=text,
                page_number=1,
                meta={"source": "text", "filename": filename}
            )]
        except UnicodeDecodeError:
            # Try latin-1 fallback
            try:
                text = content.decode("latin-1")
                return [ParsedPage(
                    text=text,
                    page_number=1,
                    meta={"source": "text", "filename": filename, "encoding": "latin-1"}
                )]
            except Exception as e:
                raise ValueError(f"Failed to parse text file: {str(e)}")
