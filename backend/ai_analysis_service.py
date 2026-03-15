import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini with fallback
api_key = os.getenv("GEMINI_API_KEY")
model = None

if api_key:
    try:
        genai.configure(api_key=api_key)
        # Try 1.5 Flash first, fallback to Pro if not found
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            # Test model availability
            print("Gemini 1.5 Flash initialized.")
        except Exception:
            print("Gemini 1.5 Flash not available, falling back to Gemini Pro.")
            model = genai.GenerativeModel('gemini-pro')
    except Exception as e:
        print(f"Gemini Configuration Error: {e}")

def analyze_evidence(ocr_text: str):
    # If initialization failed, we can't proceed
    if not model:
        return {
            "crime_type": "Key Error",
            "incident_overview": "GEMINI_API_KEY is missing or invalid. Please check Render Environment variables.",
            "evidence_observed": [], "timeline": []
        }

    # List available models to logs for debugging (only happens once)
    try:
        print("--- Available Gemini Models ---")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"Model ID: {m.name}")
        print("-------------------------------")
    except Exception as list_e:
        print(f"Could not list models: {list_e}")

    prompt = f"""You are a professional Cybercrime Forensic Investigator.
Analyze the following extracted text from suspected cybercrime evidence and generate a comprehensive, highly detailed incident report.

OCR Text:
{ocr_text}

Provide your analysis in a structured JSON format with the following keys:
1. "crime_type": The specific category (e.g., Phishing, Financial Fraud).
2. "incident_overview": A deep, multi-paragraph narrative (at least 200 words) describing the incident. Use the following internal subheadings within the text (each on a new line ending with a colon):
   - Executive Summary:
   - Modus Operandi:
   - Technical Observations:
   - Evidence of Intent:
3. "evidence_observed": A list of specific items seen in the text.
4. "methods_used": A technical summary of the attack vectors.
5. "indicators": Lists of URLs, phone numbers, or emails found.
6. "impact": Assessment of financial or data loss.
7. "recommended_action": Steps the victim should take.
8. "timeline": A chronological breakdown of the events.

CRITICAL: The "incident_overview" must be professional, formal, and sufficiently detailed to be used in a police complaint.
Return ONLY valid JSON.
"""

    # Try different model names in sequence until one works (based on discovery logs)
    # Prioritizing 'latest' aliases and 'lite' models which often have better free quotas
    models_to_try = [
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash'
    ]
    
    response = None
    last_error = "No models available"
    import time

    for model_name in models_to_try:
        try:
            print(f"Attempting analysis with {model_name}...")
            target_model = genai.GenerativeModel(model_name)
            response = target_model.generate_content(prompt)
            if response:
                break
        except Exception as e:
            last_error = str(e)
            if "404" in last_error or "NotFound" in last_error:
                print(f"{model_name} not found. Trying next...")
                continue
            elif "429" in last_error or "quota" in last_error.lower():
                print(f"Quota exceeded for {model_name}. Waiting 1s and trying next...")
                time.sleep(1) # Small breather
                continue
            else:
                print(f"Critical error with {model_name}: {last_error}")
                break

    if not response or last_error and "quota" in last_error.lower() and not response:
        return {
            "crime_type": "Rate Limited",
            "incident_overview": "The AI is currently receiving too many requests. This is a temporary limit on the Google Free Tier. Please wait 1-2 minutes and try uploading again. Your OCR data is safe.",
            "evidence_observed": ["Google API Quota Exceeded"],
            "methods_used": "N/A", "indicators": [], "impact": "N/A", "recommended_action": "Retry in 2 minutes.", "timeline": []
        }

    try:
        # Handle cases where the response might be blocked by safety filters
        if not response.candidates or not response.candidates[0].content.parts:
             print(f"AI Warning: Response was blocked. Safety Feedback: {response.prompt_feedback}")
             return {
                "crime_type": "Content Blocked",
                "incident_overview": "The AI could not analyze this evidence because it triggered a safety filter.",
                "evidence_observed": [], "methods_used": "N/A", "indicators": [], "impact": "N/A", "recommended_action": "N/A", "timeline": []
             }

        text_response = response.text
        
        # Robust JSON extraction: Find content between first { and last }
        first_brace = text_response.find('{')
        last_brace = text_response.rfind('}')
        
        if first_brace != -1 and last_brace != -1:
            json_str = text_response[first_brace:last_brace+1]
            try:
                # Clean common AI-added invalid characters/formatting
                json_str = re.sub(r',\s*}', '}', json_str) # Remove trailing commas
                return json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"Sub-JSON Parse Error: {e}")
                # Fallback: try removing common markdown or commentary artifacts if present
                clean_json_str = re.sub(r'//.*', '', json_str) # Remove comments
                return json.loads(clean_json_str)
        
        return json.loads(text_response)
    except Exception as e:
        print(f"Final AI Processing Error: {str(e)}")
        print(f"Raw text that failed: {text_response[:500]}...")
        return {
            "error": "Failed to parse AI response",
            "crime_type": "Data Format Error",
            "incident_overview": "The AI analysis succeeded but the data format was slightly corrupted. Please try again."
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
