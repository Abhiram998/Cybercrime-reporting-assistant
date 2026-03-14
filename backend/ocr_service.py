import pytesseract
from PIL import Image
import os

# Set tesseract path for Linux (Render) if needed
if os.name == 'posix':
    tesseract_linux_path = '/usr/bin/tesseract'
    if os.path.exists(tesseract_linux_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_linux_path

def extract_text_from_image(image_path: str) -> str:
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        error_msg = f"OCR Error: {str(e)}"
        print(error_msg)
        return f"OCR processing failed. Error: {str(e)}"
