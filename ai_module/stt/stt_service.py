def speech_to_text_bytes(audio_bytes, primary_lang="en-US", alternative_langs=None, mock=False):
    """
    Logic:
    - primary_lang: The user's main selection (e.g., 'hi-IN')
    - alternative_langs: List of up to 3 other languages (e.g., ['en-US', 'ta-IN'])
    """
    # Mock Mode 
    if mock:
        return {
            "success": True, 
            "text": f"[MOCK] Result for {primary_lang}", 
            "detected_language": primary_lang
        }

    stt_client = get_speech_client()
    if not stt_client:
        return {"success": False, "error": "Client not initialized"}

    audio = speech.RecognitionAudio(content=audio_bytes)
    
    safe_alternatives = alternative_langs[:3] if alternative_langs else []

    config = speech.RecognitionConfig(
        encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
        sample_rate_hertz=16000,
        language_code=primary_lang,
        alternative_language_codes=safe_alternatives,
        enable_automatic_punctuation=True,
        model="latest_short" 
    )

    try:
        response = stt_client.recognize(config=config, audio=audio)
        
        if not response.results:
            return {"success": False, "error": "No speech detected"}
            
        # The 'result' object contains the 'language_code' actually detected
        result = response.results[0]
        transcript = result.alternatives[0].transcript
        detected_lang = result.language_code 

        return {
            "success": True,
            "text": transcript.strip(),
            "detected_language": detected_lang # Tells backend which one was used
        }
    except Exception as e:
        return {"success": False, "error": str(e)}