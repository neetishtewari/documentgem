import os
from dotenv import load_dotenv

load_dotenv()

for key, value in os.environ.items():
    if "DB" in key or "URL" in key:
        print(f"{key}: {value[:10]}...") # Print first 10 chars to avoid leaking full secrets
