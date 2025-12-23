import asyncio
from app.services.supabase import supabase
from app.services.ai_service import generate_embedding
from app.core.config import settings
from textwrap import shorten

async def test_rag(query: str):
    print(f"\n--- Testing RAG for query: '{query}' ---")
    
    # 1. Generate Embedding
    print("1. Generating embedding...")
    embedding = await generate_embedding(query)
    if not embedding:
        print("ERROR: Failed to generate embedding.")
        return

    # 2. Search DB
    print("2. Searching database...")
    try:
        # We need a user_id. From previous context file, I saw a hardcoded one or I can fetch one.
        # Let's try to find a user or just search without user filter if possible (but the RPC enforces it usually)
        # The RPC `match_documents` uses `auth.uid()` by default or `filter_user_id`.
        # Since we are running as service role (hopefully) or anon, `auth.uid()` might be null.
        # Let's check `03_add_users.sql`: `filter_user_id uuid default auth.uid()`.
        # If we pass explicit filter_user_id, it should work.
        
        # Determine a user_id to test with.
        # I'll just pick the first user from auth.users if I can, or use the one from the earlier `verify_db.py`
        user_id = "1b8e4635-aae7-4e9d-9543-b2ff1a1820bd" # From verify_db.py
        print(f"   Using Test User ID: {user_id}")

        res = supabase.rpc("match_documents", {
            "query_embedding": embedding,
            "match_threshold": 0.1, # Low threshold to catch anything
            "match_count": 5,
            "filter_user_id": user_id 
        }).execute()
        
        matches = res.data
        print(f"3. Found {len(matches)} matches.")
        
        for i, match in enumerate(matches):
            content = match.get('content', '')
            score = match.get('similarity', 0)
            print(f"   [{i+1}] Score: {score:.4f} | Content: {shorten(content, width=100)}")
            
    except Exception as e:
        print(f"ERROR: Database search failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_rag("invoice"))
    asyncio.run(test_rag("highest amount"))
