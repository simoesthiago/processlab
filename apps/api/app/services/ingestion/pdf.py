from typing import List
import io
from pypdf import PdfReader
from .base import BaseParser, ParsedPage

class PDFParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> List[ParsedPage]:
        pages = []
        try:
            reader = PdfReader(io.BytesIO(content))
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text.strip():
                    pages.append(ParsedPage(
                        text=text,
                        page_number=i + 1,
                        meta={"source": "pdf", "filename": filename}
                    ))
        except Exception as e:
            # Log error but maybe return what we have or raise
            raise ValueError(f"Failed to parse PDF: {str(e)}")
            
        return pages
