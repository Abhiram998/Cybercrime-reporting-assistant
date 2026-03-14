import pytesseract
import re
import os
from PIL import Image

def extract_text_from_image(image_path: str) -> str:
    try:
        # Using pytesseract instead of easyocr to stay under 512MB RAM
        text = pytesseract.image_to_string(Image.open(image_path))
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return ""

def extract_indicators(text: str):
    # Regex patterns
    urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', text)
    phones = re.findall(r'(?:\+91|91|0)?[6-9]\d{9}', text)
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    # UPI IDs: something@bankname
    upi_ids = re.findall(r'[a-zA-Z0-9.-]+@[a-zA-Z]{3,}', text)
    # Transaction IDs (alphanumeric, 8+ chars typically)
    transaction_ids = re.findall(r'\b[A-Z0-9]{8,16}\b', text)
    # OTP codes (4-6 digits)
    otp_codes = re.findall(r'\b\d{4,6}\b', text)

    return {
        "urls": list(set(urls)),
        "phones": list(set(phones)),
        "emails": list(set(emails)),
        "upi_ids": list(set(upi_ids)),
        "transaction_ids": list(set(transaction_ids)),
        "otp_codes": list(set(otp_codes))
    }

def detect_crime_type(text: str) -> str:
    text_lower = text.lower()
    
    phishing_keywords = ["verify account", "login", "password", "click here", "secure-login", "bank-login"]
    financial_fraud_keywords = ["payment received", "credited", "transaction", "upi", "debit", "bank transfer"]
    otp_scam_keywords = ["otp", "verification code", "don't share", "share otp"]
    
    if any(k in text_lower for k in phishing_keywords):
        return "Phishing"
    if any(k in text_lower for k in otp_scam_keywords):
        return "OTP Scam"
    if any(k in text_lower for k in financial_fraud_keywords):
        return "Financial Fraud"
    if "login" in text_lower or "bank" in text_lower:
        return "Fake Website"
    
    return "Cybercrime"

def generate_ai_description(text: str, crime_type: str, indicators: dict) -> str:
    if not text:
        return "No text could be extracted from the evidence."

    description = f"The evidence appears to be related to a {crime_type} attempt. "
    
    if indicators["urls"]:
        description += f"A suspicious link was detected: {indicators['urls'][0]}. "
    
    if indicators["phones"]:
        description += f"A contact number {indicators['phones'][0]} was identified in the evidence. "
        
    if "bank" in text.lower() or "account" in text.lower():
        description += "The message impersonates a financial institution to gain trust. "
        
    description += f"\n\nFull text analysis: \"{text[:200]}...\""
    
    return description

def analyze_evidence(image_path: str):
    ocr_text = extract_text_from_image(image_path)
    indicators = extract_indicators(ocr_text)
    crime_type = detect_crime_type(ocr_text)
    ai_description = generate_ai_description(ocr_text, crime_type, indicators)
    
    # Return formatted result for frontend
    return {
        "ocr_text": ocr_text,
        "crime_type": crime_type,
        "description": ai_description,
        "indicators": indicators,
        "suspect_contact": indicators["phones"][0] if indicators["phones"] else (indicators["emails"][0] if indicators["emails"] else "Unknown")
    }
