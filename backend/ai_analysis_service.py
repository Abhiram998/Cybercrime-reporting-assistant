import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def analyze_evidence(ocr_text: str):
    if not model:
        # Fallback if no API key is provided - returning a generic but structured mock
        return {
            "crime_type": "Suspected Cybercrime",
            "incident_overview": "Evidence contains suspicious communication patterns. (Check GEMINI_API_KEY in .env to enable detailed AI analysis)",
            "evidence_observed": ["Suspicious text detected"],
            "methods_used": "Social Engineering / Unknown",
            "indicators": ["Grammar/Urgency cues"],
            "impact": "Potential compromise of personal or financial data",
            "recommended_action": "Do not click links. Block sender. Report to authorities.",
            "timeline": [
                "1. User received suspicious communication.",
                "2. System detected potential malicious indicators in the text.",
                "3. AI analysis flagged the event for further review."
            ]
        }

    prompt = f"""You are a cybersecurity investigation assistant.

Analyze the following extracted text from suspected cybercrime evidence.

OCR Text:
{ocr_text}

Generate a structured cybercrime analysis with the following sections:

1. Cybercrime Category
Identify the most likely cybercrime type. 
Possible categories include: Phishing, Financial Fraud, OTP Scam, Identity Theft, Fake Payment Scam, Online Harassment.

2. Incident Overview
Provide a clear explanation of what appears to have happened.

3. Evidence Observed
List important elements detected in the evidence such as links, phone numbers, emails, transaction IDs, urgent phrases.

4. Methods Used by the Attacker
Explain how the attacker attempted the cybercrime.

5. Indicators of Malicious Activity
List suspicious characteristics detected in the message.

6. Potential Impact on the Victim
Explain possible consequences such as financial loss or credential theft.

7. Recommended Action
Suggest appropriate action such as reporting to cybercrime authorities.

8. Incident Timeline
Generate a chronological timeline of the suspected cybercrime events based on the text.

Return the output in STRICT JSON format with these exact keys:
"crime_type", "incident_overview", "evidence_observed", "methods_used", "indicators", "impact", "recommended_action", "timeline"
"""

    try:
        response = model.generate_content(prompt)
        text_response = response.text
        
        # Extract JSON from response if it's wrapped in markdown
        json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return json.loads(text_response)
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        return {
            "error": "Failed to analyze evidence with AI",
            "crime_type": "Under-determined",
            "incident_overview": "Error during AI processing."
        }

def analyze_url(url: str):
    """
    Basic heuristic URL analysis. 
    In a real-world scenario, this would call VirusTotal or PhishTank.
    """
    suspicious_tlds = ['.xyz', '.top', '.ru', '.pw', '.bid', '.icu', '.monster']
    is_suspicious = any(url.lower().endswith(tld) for tld in suspicious_tlds)
    
    risk_level = "Low"
    category = "Benign/Unknown"
    
    if is_suspicious:
        risk_level = "High"
        category = "Phishing/Suspicious TLD"
    elif "bank" in url.lower() or "secure" in url.lower() or "login" in url.lower():
        risk_level = "Medium"
        category = "Potential Spoofing"
        
    return {
        "url": url,
        "risk_level": risk_level,
        "category": category
    }
