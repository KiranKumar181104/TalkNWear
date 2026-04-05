from ai_module.stt.stt_service import speech_to_text_bytes

# Testing the "Primary + Alternatives" logic
test_cases = [
    {
        "file": "ai_module/stt/test_hinglish.wav",
        "primary": "hi-IN",
        "alt": ["en-US"]
    },
    {
        "file": "ai_module/stt/test_hin.wav",
        "primary": "hi-IN",
        "alt": ["en-US", "es-ES"]
    },
    {
        "file": "ai_module/stt/test_en.wav",
        "primary": "en-US",
        "alt": ["hi-IN", "fr-FR"]
    }
]

for case in test_cases:
    # Pass the hints dynamically
    result = speech_to_text_bytes(
        audio_bytes=open(case["file"], "rb").read(),
        primary_lang=case["primary"],
        alternative_langs=case["alt"],
        mock=True
    )
    print(f"File: {case['file']} -> Result: {result}")