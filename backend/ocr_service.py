import pytesseract
from PIL import Image
import re
import os

def extract_text_from_image(image_path: str) -> str:
    """
    Extracts text from an image using Tesseract OCR.
    Tesseract is much lighter on memory than EasyOCR/PyTorch.
    """
    try:
        if not os.path.exists(image_path):
            print(f"Error: Image path does not exist: {image_path}")
            return ""
            
        # Open image using PIL
        img = Image.open(image_path)
        
        # Extract text
        text = pytesseract.image_to_string(img)
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

try:
    from . import ai_analysis_service
except ImportError:
    import ai_analysis_service

def extract_indicators(text: str):
    """
    Extracts technical indicators (URLs, Phones, Emails, etc.) from text using Regex.
    """
    # Regex patterns
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
    phones = re.findall(r'(?:\+91|91|0)?[6-9]\d{9}', text)
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    upi_ids = re.findall(r'[a-zA-Z0-9.-]+@[a-zA-Z]{3,}', text)
    transaction_ids = re.findall(r'\b[A-Z0-9]{8,16}\b', text)
    otp_codes = re.findall(r'\b\d{4,6}\b', text)

    return {
        "urls": list(set(urls)),
        "phones": list(set(phones)),
        "emails": list(set(emails)),
        "upi_ids": list(set(upi_ids)),
        "transaction_ids": list(set(transaction_ids)),
        "otp_codes": list(set(otp_codes))
    }

def analyze_evidence(image_path: str):
    """
    Orchestrates the full evidence analysis pipeline using memory-safe Tesseract.
    """
    ocr_text = extract_text_from_image(image_path)
    indicators = extract_indicators(ocr_text)
    
    # Run Deep AI Analysis (Gemini API handles the heavy lifting off-server)
    ai_result = ai_analysis_service.analyze_evidence(ocr_text)
    
    # Analyze each URL for threat level
    url_threats = [ai_analysis_service.analyze_url(url) for url in indicators["urls"]]
    
    # Return formatted result for frontend
    return {
        "ocr_text": ocr_text,
        "crime_type": ai_result.get("crime_type", "Cybercrime"),
        "description": ai_result.get("incident_overview", ""),
        "incident_overview": ai_result.get("incident_overview", ""),
        "methods_used": ai_result.get("methods_used", ""),
        "indicators_list": ai_result.get("indicators", []),
        "impact": ai_result.get("impact", ""),
        "recommended_action": ai_result.get("recommended_action", ""),
        "evidence_observed": ai_result.get("evidence_observed", []),
        "timeline": ai_result.get("timeline", []),
        "url_threats": url_threats,
        "indicators": indicators,
        "suspect_contact": indicators["phones"][0] if indicators["phones"] else (indicators["emails"][0] if indicators["emails"] else "Unknown")
    }
