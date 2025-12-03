import os
import subprocess
from dotenv import load_dotenv

def apply_migration():
    load_dotenv()
    
    # Try to find a postgres connection string
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    
    if not db_url:
        # Try to construct it? No password available usually.
        # Check if SUPABASE_DB_PASSWORD exists?
        print("No DATABASE_URL or POSTGRES_URL found in .env")
        return

    print("Found database URL. Attempting to run migration via psql...")
    
    try:
        # Run psql
        # We need to pass the file content
        migration_file = "migrations/04_create_alerts.sql"
        
        # Use subprocess to run psql
        # psql "postgres://user:pass@host:5432/db" -f file.sql
        cmd = ["psql", db_url, "-f", migration_file]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("Migration applied successfully!")
            print(result.stdout)
        else:
            print("Failed to apply migration:")
            print(result.stderr)
            
    except Exception as e:
        print(f"Error running psql: {e}")

if __name__ == "__main__":
    apply_migration()
