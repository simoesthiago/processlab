from typing import List
import io
import docx
from .base import BaseParser, ParsedPage

class DocxParser(BaseParser):
    def parse(self, content: bytes, filename: str) -> List[ParsedPage]:
        pages = []
        try:
            doc = docx.Document(io.BytesIO(content))
            full_text = []
            for para in doc.paragraphs:
                if para.text.strip():
                    full_text.append(para.text)
            
            # DOCX doesn't have pages in the same way, so we treat it as one page or chunk it later.
            # For now, return as single page.
            text = "\n".join(full_text)
            if text:
                pages.append(ParsedPage(
                    text=text,
                    page_number=1,
                    meta={"source": "docx", "filename": filename}
                ))
        except Exception as e:
            raise ValueError(f"Failed to parse DOCX: {str(e)}")
            
        return pages
