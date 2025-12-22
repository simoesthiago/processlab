import pytesseract
from pdf2image import convert_from_path, convert_from_bytes
from PIL import Image
import io
from typing import Union

class OCRService:
    @staticmethod
    def extract_text_from_image(image: Image.Image) -> str:
        return pytesseract.image_to_string(image)

    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
        images = convert_from_bytes(pdf_bytes)
        text = ""
        for image in images:
            text += pytesseract.image_to_string(image) + "\n"
        return text

    @staticmethod
    def extract_text_from_file(file_path: str) -> str:
        if file_path.endswith(".pdf"):
            images = convert_from_path(file_path)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image) + "\n"
            return text
        elif file_path.endswith((".png", ".jpg", ".jpeg")):
            return pytesseract.image_to_string(Image.open(file_path))
        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        return ""
