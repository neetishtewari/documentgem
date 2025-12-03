from app.services.supabase import supabase
import asyncio

def check_db():
    try:
        response = supabase.table("documents").select("*", count="exact").is_("user_id", "null").execute()
        print(f"Documents with NULL user_id: {len(response.data)}")
        
        response_all = supabase.table("documents").select("*", count="exact").execute()
        print(f"Total documents: {len(response_all.data)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db()
