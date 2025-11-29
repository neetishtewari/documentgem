from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends
from fastapi.concurrency import run_in_threadpool
from app.core.config import settings
from app.services.supabase import supabase
from app.dependencies.auth import get_current_user
import uuid
import os
import shutil
from app.services.ai_service import classify_document, generate_embedding, chunk_text

router = APIRouter()

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
                    # Note: We don't need user_id here as it's already on the document
                    # and RLS policies (if using service role) will allow it.
                    # If using anon key, we might need to be careful, but for now assuming service role or permissive RLS for backend.
                    def insert_embedding():
                        # We need to fetch the user_id from the document first if we want to be explicit,
                        # but the migration added a default auth.uid(). 
                        # Since this is a background task, auth.uid() might be null.
                        # Ideally, we should fetch the document's user_id and insert it.
                        
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

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    try:
        # 1. Upload file to Supabase Storage
        file_ext = file.filename.split(".")[-1]
        file_path = f"{user.id}/{uuid.uuid4()}.{file_ext}" # Organize by user_id
        file_content = await file.read()
        
        # Upload to 'documents' bucket (Blocking -> Thread Pool)
        def upload_to_storage():
            return supabase.storage.from_("documents").upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
        
        await run_in_threadpool(upload_to_storage)
        
        # 2. Save metadata to Database
        document_data = {
            "name": file.filename,
            "file_path": file_path,
            "type": file.content_type,
            "size": len(file_content),
            "category": "Processing...", # Initial state
            "user_id": user.id
        }
        
        # Blocking DB insert -> Thread Pool
        def insert_doc():
            return supabase.table("documents").insert(document_data).execute()
            
        response = await run_in_threadpool(insert_doc)
        document = response.data[0]
        document_id = document['id']

        # 3. Trigger AI Classification in Background
        background_tasks.add_task(process_document_ai, document_id, file_content, file.content_type)
        
        return {"message": "File uploaded successfully", "document": document}

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats(
    start_date: str = None,
    end_date: str = None,
    user = Depends(get_current_user)
):
    try:
        # Get counts by category for the current user
        query = supabase.table("documents").select("category").eq("user_id", user.id)
        
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
            
        response = query.execute()
        categories = [doc['category'] for doc in response.data]
        
        from collections import Counter
        counts = Counter(categories)
        
        return {
            "total_documents": len(categories),
            "category_counts": counts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_documents(
    category: str = None, 
    start_date: str = None,
    end_date: str = None,
    user = Depends(get_current_user)
):
    # Changed to sync def so FastAPI runs it in a thread pool automatically
    try:
        query = supabase.table("documents").select("*").eq("user_id", user.id).order("created_at", desc=True)
        
        if category and category != "All":
            query = query.eq("category", category)
            
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
def delete_document(document_id: str, user = Depends(get_current_user)):
    try:
        # 1. Get document to find file path
        response = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        document = response.data
        file_path = document.get("file_path")

        # 2. Delete from Storage
        if file_path:
            supabase.storage.from_("documents").remove([file_path])

        # 3. Delete from Database
        supabase.table("documents").delete().eq("id", document_id).execute()
        
        return {"message": "Document deleted successfully"}

    except Exception as e:
        print(f"Delete Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

