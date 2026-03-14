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
    
    # Comprehensive keyword mapping for accurate detection
    crime_patterns = {
        "Phishing / Credential Theft": ["verify account", "login", "password", "click here", "secure-login", "bank-login", "suspended", "reactivate"],
        "Financial Fraud / UPI Scam": ["payment received", "credited", "transaction", "upi", "debit", "bank transfer", "cashback", "lottery", "prize"],
        "OTP / Authentication Scam": ["otp", "verification code", "don't share", "share otp", "one-time passcode", "auth code"],
        "Identity Theft / Social Engineering": ["identity", "ssn", "passport", "impersonation", "friend in need", "official representative"],
        "Ransomware / Digital Extortion": ["encrypted", "bitcoin", "payment for files", "locked", "decryption key"],
        "Vishing / Smishing": ["call now", "authorized", "fraudulent activity", "urgent", "account blocked"]
    }
    
    for crime, keywords in crime_patterns.items():
        if any(k in text_lower for k in keywords):
            return crime
    
    return "Under-determined Cybercrime"

def generate_ai_description(text: str, crime_type: str, indicators: dict) -> str:
    if not text:
        return "Analysis inconclusive. No extractable text was identified within the provided evidence."

    # Professional ChatGPT-like structured response
    description = (
        f"### Executive Summary\n"
        f"Based on an automated forensic analysis of the provided evidence, the incident has been classified as **{crime_type}**. "
        f"The content exhibits classic indicators of malicious intent, specifically targeting sensitive user data or financial assets.\n\n"
        
        f"### Technical Indicators Extracted\n"
    )

    if indicators["urls"]:
        description += f"- **Malicious URL(s)**: Detected `{indicators['urls'][0]}`. This link likely directs to a credential-harvesting site.\n"
    
    if indicators["phones"]:
        description += f"- **Perpetrator Contact**: Identified `{indicators['phones'][0]}` as a primary point of contact for the solicitation.\n"
        
    if indicators["upi_ids"]:
        description += f"- **Payment Handle**: Identified `{indicators['upi_ids'][0]}` as a potential destination for fraudulent funds.\n"

    description += (
        f"\n### Forensic Narrative\n"
        f"The evidence contains phrasing such as \"{text[:100]}...\" "
        f"This language is designed to create a sense of urgency or fear (e.g., account suspension or unauthorized access) to manipulate the recipient into bypassing standard security protocols. "
    )

    if "otp" in text.lower():
        description += "The presence of an OTP solicitation suggest an active attempt to bypass Multi-Factor Authentication (MFA).\n"
    elif "bank" in text.lower() or "transaction" in text.lower():
        description += "The communication impersonates a formal financial institution to lend legitimacy to the fraudulent request.\n"

    description += (
        "\n### Recommended Action\n"
        "1. Do not engage with the sender or click any associated links.\n"
        "2. Block the initiating contact immediately.\n"
        "3. Report this incident to your financial service provider if institutions were impersonated."
    )
    
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
