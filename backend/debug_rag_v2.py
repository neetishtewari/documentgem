import asyncio
from app.services.supabase import supabase
from app.services.ai_service import generate_embedding
from textwrap import shorten

async def test_threshold(query: str):
    print(f"\n--- Testing Threshold for query: '{query}' ---")
    
    embedding = await generate_embedding(query)
    
    # Test User ID (using the one from before or trying to match what the app uses)
    # If the user is logged in the app, they use their auth.uid().
    # I'll use the ID from the previous effective debug run: "1b8e4635-aae7-4e9d-9543-b2ff1a1820bd"
    user_id = "1b8e4635-aae7-4e9d-9543-b2ff1a1820bd"

    # 1. Strict Threshold (Current Prod)
    print("\n1. Strict Threshold (0.5):")
    res_strict = supabase.rpc("match_documents", {
        "query_embedding": embedding,
        "match_threshold": 0.5,
        "match_count": 5,
        "filter_user_id": user_id
    }).execute()
    print(f"   Matches: {len(res_strict.data)}")
    
    # 2. Lenient Threshold (Proposed)
    print("\n2. Lenient Threshold (0.1):")
    res_lenient = supabase.rpc("match_documents", {
        "query_embedding": embedding,
        "match_threshold": 0.1,
        "match_count": 5,
        "filter_user_id": user_id
    }).execute()
    print(f"   Matches: {len(res_lenient.data)}")
    
    for match in res_lenient.data:
        print(f"   - Score: {match['similarity']:.4f} | {shorten(match['content'], 50)}")

if __name__ == "__main__":
    asyncio.run(test_threshold("overdue invoices"))
