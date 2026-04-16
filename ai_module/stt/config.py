import os
from dotenv import load_dotenv

load_dotenv()

def verify_config():
    api_key = os.getenv("DEEPGRAM_API_KEY")
    
    if not api_key:
        print("❌ ERROR: DEEPGRAM_API_KEY not found in .env file")
        return False
        
    if len(api_key) < 10:
        print("❌ ERROR: DEEPGRAM_API_KEY looks invalid or too short")
        return False
        
    return True