from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.concurrency import run_in_threadpool
from app.core.config import settings
from supabase import create_client, Client
import uuid
import os
import shutil
from app.services.ai_service import classify_document, generate_embedding, chunk_text

router = APIRouter()

# Initialize Supabase client
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def process_document_ai(document_id: str, file_content: bytes, file_type: str):
    """
    Background task to classify document, update DB, and generate embeddings.
    """
    try:
        # 1. Classify and Extract Metadata (Async)
        result = await classify_document(file_content, file_type)
        
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
        # We need to extract text again (or return it from classify_document to be efficient)
        # For now, let's re-extract to keep it simple,        # 2. Generate Embeddings for RAG
        import io
        from pypdf import PdfReader
        
        text_content = ""
        print(f"Processing file type: {file_type}")
        if "pdf" in file_type:
            try:
                pdf_file = io.BytesIO(file_content)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    text_content += page.extract_text() or ""
                print(f"Extracted {len(text_content)} characters from PDF.")
            except Exception as e:
                print(f"PDF Extraction Error: {e}")
        
        if text_content:
            chunks = chunk_text(text_content)
            print(f"Generated {len(chunks)} chunks.")
            for i, chunk in enumerate(chunks):
                embedding = await generate_embedding(chunk)
                if embedding:
                    # Blocking DB insert -> Thread Pool
                    def insert_embedding():
                        supabase.table("document_embeddings").insert({
                            "document_id": document_id,
                            "content": chunk,
                            "embedding": embedding
                        }).execute()
                    await run_in_threadpool(insert_embedding)
                    print(f"Inserted embedding for chunk {i+1}/{len(chunks)}")
                    
            print(f"Generated embeddings for document {document_id}")
        else:
            print("No text content extracted to embed.")

    except Exception as e:
        print(f"Background AI Task Error: {e}")

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    try:
        # 1. Upload file to Supabase Storage
        file_ext = file.filename.split(".")[-1]
        file_path = f"{uuid.uuid4()}.{file_ext}"
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
            "category": "Processing..." # Initial state
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
def get_stats():
    try:
        # Get counts by category
        # Supabase doesn't support "group by" easily via the JS/Python client builder in a single call 
        # without using .rpc() or raw SQL. 
        # For simplicity/speed in this prototype, we'll fetch all categories and count in Python 
        # (efficient enough for <1000 docs). For prod, use .rpc().
        
        response = supabase.table("documents").select("category").execute()
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
def get_documents(category: str = None):
    # Changed to sync def so FastAPI runs it in a thread pool automatically
    try:
        query = supabase.table("documents").select("*").order("created_at", desc=True)
        
        if category and category != "All":
            query = query.eq("category", category)
            
        response = query.execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

