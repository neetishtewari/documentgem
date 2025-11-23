import asyncio
from app.core.config import settings
from supabase import create_client, Client

supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def check_db():
    # Get the latest 5 documents
    response = supabase.table("documents").select("*").order("created_at", desc=True).limit(5).execute()
    if not response.data:
        print("No documents found.")
        return

    for doc in response.data:
        print(f"\n--- Document: {doc['name']} (ID: {doc['id']}) ---")
        print(f"Created At: {doc['created_at']}")
        print(f"Category: {doc['category']}")
        print(f"Summary: {doc['summary']}")
        
        # Check embeddings
        emb_response = supabase.table("document_embeddings").select("count", count="exact").eq("document_id", doc['id']).execute()
        print(f"Embedding Count: {emb_response.count}")

if __name__ == "__main__":
    asyncio.run(check_db())
