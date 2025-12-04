import os
from dotenv import load_dotenv

load_dotenv()

print("Available keys in .env:")
for key in os.environ.keys():
    if "URL" in key or "DB" in key or "SUPABASE" in key:
        print(key)
