import pytesseract
import re
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

    # Identify potential scam themes from text
    text_lower = text.lower()
    scam_theme = "Unspecified Cybercrime"
    if any(k in text_lower for k in ["package", "delivery", "tracking", "courier"]):
        scam_theme = "Logistics/Delivery Scam (Smishing)"
    elif any(k in text_lower for k in ["bank", "account", "transaction", "upi", "kyc", "card"]):
        scam_theme = "Financial/Banking Fraud"
    elif any(k in text_lower for k in ["login", "password", "verify", "secure", "locked"]):
        scam_theme = "Credential Harvesting / Phishing"
    elif any(k in text_lower for k in ["job", "work from home", "salary", "commission", "task"]):
        scam_theme = "Employment/Task-based Fraud"
    elif any(k in text_lower for k in ["lottery", "prize", "won", "reward", "congratulations"]):
        scam_theme = "Advance Fee / Lottery Scam"

    # Professional ChatGPT-like structured response
    description = (
        f"### Executive Summary\n"
        f"The forensic analysis of the submitted evidence identifies this incident as a **{crime_type}**, specifically following the pattern of a **{scam_theme}**. "
        f"The perpetrator is utilizing sophisticated social engineering tactics to deceive the recipient into performing unauthorized actions or disclosing sensitive information.\n\n"
        
        f"### Technical Indicators Extracted\n"
    )

    has_indicators = False
    if indicators["urls"]:
        description += f"- **Malicious Linkages**: The system detected suspicious URL(s): `{', '.join(indicators['urls'][:2])}`. These domains are frequently associated with phishing proxies and data exfiltration sites.\n"
        has_indicators = True
    
    if indicators["phones"]:
        description += f"- **Source Identifier**: The communication originated from or references `{indicators['phones'][0]}`, which serves as the primary vector for this solicitation.\n"
        has_indicators = True
        
    if indicators["upi_ids"]:
        description += f"- **Fraudulent Financial Handle**: The evidence identifies the UPI ID `{indicators['upi_ids'][0]}` as a potential collection point for illicit funds.\n"
        has_indicators = True

    if not has_indicators:
        description += "- No explicit technical indicators (URLs/Phones) were uniquely isolated, but the textual pattern remains highly suspicious.\n"

    # Extract a meaningful snippet instead of just the start
    clean_text: str = str(text).replace('\n', ' ').strip()
    if len(clean_text) > 150:
        clean_snippet = clean_text[:150] + "..."
    else:
        clean_snippet = clean_text
    
    description += (
        f"\n### Forensic Narrative & Modus Operandi\n"
        f"The evidence presents a structured attempt to manipulate the victim. Analysis of the communication (e.g., *\"{clean_snippet}\"*) reveals several psychological triggers:\n"
        f"1. **Manufactured Urgency**: Using words like 'URGENT', 'immediately', or 'last warning' to bypass critical thinking.\n"
        f"2. **Impersonation**: The attacker mimics a legitimate service provider to build a false sense of trust.\n"
        f"3. **Call to Action**: Directing the victim to an external link or requesting confidential data (like OTPs or login credentials).\n"
    )

    if "otp" in text_lower:
        description += "\n**Critical Risk**: The request for an OTP indicates an attempt to breach Multi-Factor Authentication (MFA), which could lead to complete account takeover.\n"
    elif "bank" in text_lower or "card" in text_lower:
        description += "\n**Financial Risk**: The communication targets financial assets directly, posing a significant risk of monetary loss through unauthorized transactions.\n"

    description += (
        "\n### Recommended Defensive Actions\n"
        "1. **Cease Communication**: Do not interact with the sender or follow any embedded instructions.\n"
        "2. **Verify Independently**: If you suspect the claim might be real, contact the organization directly using their official, verified contact details found on their website.\n"
        "3. **Technical Hygiene**: Clear browser cookies if a suspicious link was clicked and update passwords for related accounts immediately using a separate, secure device.\n"
        "4. **Reporting**: Flag the message as spam/phishing within your messaging app and report any financial discrepancies to your bank's fraud department within the 24-hour golden window."
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
