from ai_module.stt.stt_service import speech_to_text_bytes

test_cases = [
    {
        "file": "ai_module/stt/test_hin.wav",
        "primary": "hi",
        "alt": ["en", "es"]
    },
    {
        "file": "ai_module/stt/test_en.wav",
        "primary": "en",
        "alt": ["hi", "fr"]
    }
]

for case in test_cases:
    with open(case["file"], "rb") as f:
        audio_data = f.read()
    result = speech_to_text_bytes(
        audio_bytes=audio_data,
        primary_lang=case["primary"],
        alternative_langs=case["alt"],
        mock=False 
    )
    print(f"File: {case['file']} -> Result: {result}")