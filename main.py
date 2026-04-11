import base64
import os
import random

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
DEEPGRAM_URL = 'https://api.deepgram.com/v1/listen?language=en'

app = FastAPI(
    title="Speech-to-Text & Translation API",
    description="Mock backend API for speech-to-text and translation using FastAPI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mock_speech_responses = [
    "Hello, how are you?",
    "I love coding",
    "The weather is nice today",
    "Can you help me with this?",
    "This is a test",
]

translations = {
    "es": "Traducción:",
    "fr": "Traduction:",
    "de": "Übersetzung:",
    "ja": "翻訳:",
    "hi": "अनुवाद:",
    "ta": "மொழிபெயர்ப்பு:",
    "te": "అనువాదం:",
    "zh": "翻译:",
}


class AudioRequest(BaseModel):
    audio: str


class TranslateRequest(BaseModel):
    text: str
    targetLanguage: str


@app.post("/speech-to-text")
async def speech_to_text(request: AudioRequest):
    if not request.audio:
        raise HTTPException(status_code=400, detail="No audio data provided")

    if not DEEPGRAM_API_KEY:
        raise HTTPException(status_code=500, detail="Deepgram API key is not configured")

    try:
        audio_data = request.audio
        if audio_data.startswith("data:"):
            audio_data = audio_data.split(",", 1)[1]
        audio_bytes = base64.b64decode(audio_data)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid audio payload")

    headers = {
        "Authorization": f"Token {DEEPGRAM_API_KEY}",
        "Content-Type": "audio/wav",
    }

    response = requests.post(DEEPGRAM_URL, headers=headers, data=audio_bytes, timeout=20)
    if not response.ok:
        detail = f"Deepgram request failed with status {response.status_code}"
        try:
            detail = response.json().get("error", detail)
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail)

    try:
        result = response.json()
        alternative = result["results"]["channels"][0]["alternatives"][0]
        transcript = alternative.get("transcript", "")
        confidence = alternative.get("confidence", 0.0)
    except Exception:
        raise HTTPException(status_code=502, detail="Unable to parse Deepgram response")

    if not transcript:
        raise HTTPException(status_code=502, detail="Deepgram returned no transcript")

    return {
        "success": True,
        "text": transcript,
        "confidence": confidence,
        "language": "en",
    }


@app.post("/translate")
async def translate(request: TranslateRequest):
    if not request.text or not request.targetLanguage:
        raise HTTPException(status_code=400, detail="Missing text or targetLanguage")

    prefix = translations.get(request.targetLanguage)
    translated_text = (
        f"{prefix} {request.text}"
        if prefix
        else f"Translated to {request.targetLanguage}: {request.text}"
    )

    return {
        "success": True,
        "originalText": request.text,
        "translatedText": translated_text,
        "sourceLanguage": "en",
        "targetLanguage": request.targetLanguage,
    }


@app.get("/health")
async def health_check():
    return {"status": "Server is running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=5000)
