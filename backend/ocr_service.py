import pytesseract
from PIL import Image
import os

# You may need to set the tesseract path if it's not in your PATH
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def extract_text_from_image(image_path: str) -> str:
    try:
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return "OCR processing failed or Tesseract not installed."
