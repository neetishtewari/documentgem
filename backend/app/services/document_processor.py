from fastapi.concurrency import run_in_threadpool
from app.services.supabase import supabase
from app.services.ai_service import classify_document, generate_embedding, chunk_text

def sanitize_text(text):
    """Removes null bytes from text to prevent PostgreSQL errors."""
    if isinstance(text, str):
        return text.replace("\x00", "")
    if isinstance(text, dict):
        return {k: sanitize_text(v) for k, v in text.items()}
    if isinstance(text, list):
        return [sanitize_text(v) for v in text]
    return text

async def process_document_ai(document_id: str, file_content: bytes, file_type: str):
    """
    Background task to classify document, update DB, and generate embeddings.
    """
    try:
        # 1. Classify and Extract Metadata (Async)
        result = await classify_document(file_content, file_type)
        
        # Sanitize result
        result = sanitize_text(result)

        # Blocking DB update -> Thread Pool
        def update_db():
            supabase.table("documents").update({
                "category": result.get("category", "Uncategorized"),
                "summary": result.get("summary", ""),
                "metadata": result.get("metadata", {})
            }).eq("id", document_id).execute()
            
        await run_in_threadpool(update_db)
        
        print(f"Document {document_id} classified as {result.get('category')}")

        # 2. Generate Embeddings for RAG
        # We retrieve the text already extracted during classification
        text_content = result.get("_extracted_text", "")
        
        # If for some reason it's missing (e.g. error case), try to extract again or skip
        if not text_content:
             print("No text content found in classification result. Skipping embeddings.")
        
        # Sanitize extracted text
        text_content = sanitize_text(text_content)

        if text_content:
            chunks = chunk_text(text_content)
            print(f"Generated {len(chunks)} chunks.")
            for i, chunk in enumerate(chunks):
                # Sanitize chunk just in case
                chunk = sanitize_text(chunk)
                embedding = await generate_embedding(chunk)
                if embedding:
                    # Blocking DB insert -> Thread Pool
                    def insert_embedding():
                        # Fetch doc to get user_id
                        doc = supabase.table("documents").select("user_id").eq("id", document_id).single().execute()
                        user_id = doc.data.get("user_id")

                        supabase.table("document_embeddings").insert({
                            "document_id": document_id,
                            "content": chunk,
                            "embedding": embedding,
                            "user_id": user_id 
                        }).execute()
                    await run_in_threadpool(insert_embedding)
                    print(f"Inserted embedding for chunk {i+1}/{len(chunks)}")
                    
            print(f"Generated embeddings for document {document_id}")
        else:
            print("No text content extracted to embed.")

    except Exception as e:
        print(f"CRITICAL ERROR in Background AI Task for document {document_id}: {e}")
        import traceback
        traceback.print_exc()
        # Attempt to update status to 'Error'
        try:
            supabase.table("documents").update({
                "category": "Error"
            }).eq("id", document_id).execute()
        except:
            print("Failed to update document status to Error")
