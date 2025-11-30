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

from app.services.document_processor import process_document_ai

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
        import datetime
        document_data = {
            "name": file.filename,
            "file_path": file_path,
            "type": file.content_type,
            "size": len(file_content),
            "category": "Processing...", # Initial state
            "user_id": user.id,
            "source": "Upload",
            "source_date": datetime.datetime.now(datetime.timezone.utc).isoformat()
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

