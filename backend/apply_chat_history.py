import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("SUPABASE_DB_URL")

if not DB_URL:
    print("Error: SUPABASE_DB_URL not found in .env")
    exit(1)

def run_migration():
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        with open("migrations/05_create_chat_history.sql", "r") as f:
            sql = f.read()
            
        print("Executing migration...")
        cur.execute(sql)
        conn.commit()
        print("Migration successful!")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration failed: {e}")
        exit(1)

if __name__ == "__main__":
    run_migration()
