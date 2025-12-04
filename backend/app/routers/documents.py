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

import hashlib

@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...),
    user = Depends(get_current_user)
):
    try:
        # 1. Read content and calculate hash
        file_content = await file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # 2. Check for duplicates
        # We check if ANY document with this hash exists for this user, regardless of is_duplicate status
        # If one exists, this new one is a duplicate.
        duplicate_check = supabase.table("documents").select("id").eq("user_id", user.id).eq("content_hash", file_hash).limit(1).execute()
        is_duplicate = len(duplicate_check.data) > 0

        # 3. Upload file to Supabase Storage
        file_ext = file.filename.split(".")[-1]
        file_path = f"{user.id}/{uuid.uuid4()}.{file_ext}" # Organize by user_id
        
        # Upload to 'documents' bucket (Blocking -> Thread Pool)
        def upload_to_storage():
            return supabase.storage.from_("documents").upload(
                path=file_path,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
        
        await run_in_threadpool(upload_to_storage)
        
        # 4. Save metadata to Database
        import datetime
        document_data = {
            "name": file.filename,
            "file_path": file_path,
            "type": file.content_type,
            "size": len(file_content),
            "category": "Processing...", # Initial state
            "user_id": user.id,
            "source": "Upload",
            "source_date": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "content_hash": file_hash,
            "is_duplicate": is_duplicate
        }
        
        # Blocking DB insert -> Thread Pool
        def insert_doc():
            return supabase.table("documents").insert(document_data).execute()
            
        response = await run_in_threadpool(insert_doc)
        document = response.data[0]
        document_id = document['id']

        # 5. Trigger AI Classification in Background (Only if not a duplicate? Or always? 
        # Strategy: Always process for now, user might want to keep it because it has different metadata/name)
        background_tasks.add_task(process_document_ai, document_id, file_content, file.content_type)
        
        return {
            "message": "File uploaded successfully" + (" (Duplicate detected)" if is_duplicate else ""), 
            "document": document,
            "is_duplicate": is_duplicate
        }

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
        # Exclude duplicates from stats by default? Or keep them? 
        # Let's exclude duplicates from general stats to avoid skewing numbers
        query = supabase.table("documents").select("category").eq("user_id", user.id).eq("is_duplicate", False)
        
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
    page: int = 1,
    limit: int = 12,
    is_duplicate: bool = False, # Default to showing non-duplicates
    user = Depends(get_current_user)
):
    # Changed to sync def so FastAPI runs it in a thread pool automatically
    try:
        # Build base query
        # Filter out deleted documents (deleted_at is null)
        query = supabase.table("documents").select("*", count="exact").eq("user_id", user.id).eq("is_duplicate", is_duplicate).is_("deleted_at", "null").order("created_at", desc=True)
        
        if category and category != "All":
            query = query.eq("category", category)
            
        if start_date:
            query = query.gte("created_at", start_date)
        if end_date:
            query = query.lte("created_at", end_date)
            
        # Pagination
        start = (page - 1) * limit
        end = start + limit - 1
        
        query = query.range(start, end)
            
        response = query.execute()
        
        total_count = response.count if response.count is not None else 0
        import math
        total_pages = math.ceil(total_count / limit) if limit > 0 else 0
        
        return {
            "data": response.data,
            "total": total_count,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trash")
def get_trash(user = Depends(get_current_user)):
    """
    Get all soft-deleted documents.
    """
    try:
        response = supabase.table("documents").select("*").eq("user_id", user.id).not_.is_("deleted_at", "null").order("deleted_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{document_id}")
def update_document(
    document_id: str, 
    update_data: dict, 
    user = Depends(get_current_user)
):
    try:
        # Sanitize update_data - only allow specific fields
        allowed_fields = ["name", "category", "is_duplicate"]
        data_to_update = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not data_to_update:
            raise HTTPException(status_code=400, detail="No valid fields to update")

        response = supabase.table("documents").update(data_to_update).eq("id", document_id).eq("user_id", user.id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}")
async def delete_document(document_id: str, user = Depends(get_current_user)):
    """
    Soft delete a document (move to trash).
    """
    try:
        # 1. Verify ownership
        response = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        doc = response.data
        
        # 2. Soft Delete (Set deleted_at)
        import datetime
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        
        supabase.table("documents").update({"deleted_at": now}).eq("id", document_id).execute()
        
        # 3. Log Activity
        from app.services.activity_service import log_activity
        await log_activity(user.id, "DELETE", "DOCUMENT", document_id, {"name": doc.get("name")})
        
        return {"message": "Document moved to trash"}

    except Exception as e:
        print(f"Delete Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/restore")
async def restore_document(document_id: str, user = Depends(get_current_user)):
    """
    Restore a document from trash.
    """
    try:
        # 1. Verify ownership (include deleted records if RLS allows, usually RLS filters by user_id so it's fine)
        response = supabase.table("documents").select("*").eq("id", document_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Document not found")
            
        doc = response.data
        
        # 2. Restore (Set deleted_at to NULL)
        supabase.table("documents").update({"deleted_at": None}).eq("id", document_id).execute()
        
        # 3. Log Activity
        from app.services.activity_service import log_activity
        await log_activity(user.id, "RESTORE", "DOCUMENT", document_id, {"name": doc.get("name")})
        
        return {"message": "Document restored"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{document_id}/permanent")
async def permanent_delete_document(document_id: str, user = Depends(get_current_user)):
    """
    Permanently delete a document.
    """
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
        
        # 4. Log Activity
        from app.services.activity_service import log_activity
        await log_activity(user.id, "PERMANENT_DELETE", "DOCUMENT", document_id, {"name": document.get("name")})
        
        return {"message": "Document permanently deleted"}

    except Exception as e:
        print(f"Permanent Delete Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/backfill-hashes")
async def backfill_hashes(user = Depends(get_current_user)):
    try:
        # 1. Get ALL documents for this user (to re-evaluate duplicate status)
        response = supabase.table("documents").select("*").eq("user_id", user.id).execute()
        documents = response.data
        
        updated_count = 0
        duplicates_found = 0
        
        for doc in documents:
            try:
                file_hash = doc.get("content_hash")
                
                # 2. Calculate Hash if missing
                if not file_hash:
                    # Download file content
                    file_path = doc["file_path"]
                    file_data = supabase.storage.from_("documents").download(file_path)
                    file_hash = hashlib.sha256(file_data).hexdigest()
                
                # 3. Check for duplicates (excluding self)
                # Check if there is an OLDER document with the same hash
                dup_check = supabase.table("documents").select("id").eq("user_id", user.id).eq("content_hash", file_hash).lt("created_at", doc["created_at"]).limit(1).execute()
                is_duplicate = len(dup_check.data) > 0
                
                if is_duplicate:
                    duplicates_found += 1
                
                # 4. Update Document
                supabase.table("documents").update({
                    "content_hash": file_hash,
                    "is_duplicate": is_duplicate
                }).eq("id", doc["id"]).execute()
                
                updated_count += 1
                
            except Exception as inner_e:
                print(f"Error processing doc {doc['id']}: {inner_e}")
                continue
                
        return {
            "message": "Backfill complete",
            "processed": updated_count,
            "duplicates_flagged": duplicates_found
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
