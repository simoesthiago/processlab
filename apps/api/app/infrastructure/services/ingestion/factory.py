from typing import Dict, Type
from .base import BaseParser
from .pdf import PDFParser
from .docx import DocxParser
from .text import TextParser

class ParserFactory:
    _parsers: Dict[str, Type[BaseParser]] = {
        "application/pdf": PDFParser,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": DocxParser,
        "application/msword": DocxParser, # Attempt to use DocxParser for doc, might fail but better than nothing
        "text/plain": TextParser,
    }

    @classmethod
    def get_parser(cls, mime_type: str) -> BaseParser:
        parser_cls = cls._parsers.get(mime_type)
        if not parser_cls:
            # Default to text if unknown? Or raise?
            # For now raise
            raise ValueError(f"No parser found for mime type: {mime_type}")
        return parser_cls()
