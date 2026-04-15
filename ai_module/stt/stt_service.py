import os
import requests
from dotenv import load_dotenv

load_dotenv()

DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')

def speech_to_text_bytes(audio_bytes, primary_lang="en", alternative_langs=None, mock=False):

    if mock:
        return {
            "success": True, 
            "text": "[MOCK] Deepgram Result", 
            "language": primary_lang
        }

    if not DEEPGRAM_API_KEY:
        return {
            "success": False, 
            "error": "API Key is Missing"
        }

    url = f"https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&language={primary_lang}"

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "application/octet-stream"
    }

    try:
        response = requests.post(url, headers=headers, data=audio_bytes, timeout=20)
        
        if not response.ok:
            return {
                "success": False, 
                "error": f"Deepgram failed: {response.status_code}"
            }

        result = response.json()
        
        alternative = result["results"]["channels"][0]["alternatives"][0]
        transcript = alternative.get("transcript", "")
        confidence = alternative.get("confidence", 0.0)

        if not transcript:
            return {
                "success": False, 
                "error": "No speech detected"
            }

        return {
            "success": True,
            "text": transcript.strip(),
            "confidence": confidence,
            "language": primary_lang
        }

    except Exception as e:
        return {
            "success": False, 
            "error": str(e)
        }