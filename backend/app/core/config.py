import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Document Intelligence Platform"
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")

settings = Settings()
