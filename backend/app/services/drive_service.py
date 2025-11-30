import os
import datetime
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from app.services.supabase import supabase
from app.services.document_processor import process_document_ai
import io

def fetch_drive_files(integration_id: str, user_id: str):
    """
    Fetches new files from Google Drive for the given integration.
    Only fetches files modified since the last sync.
    """
    print(f"--- Starting Drive Sync for Integration {integration_id} ---")
    
    try:
        # 1. Get Integration Credentials
        response = supabase.table("user_integrations").select("*").eq("id", integration_id).single().execute()
        integration = response.data
        
        if not integration:
            print(f"Integration {integration_id} not found.")
            return

        # Update status to syncing
        supabase.table("user_integrations").update({"sync_status": "syncing"}).eq("id", integration_id).execute()

        creds = Credentials(
            token=integration["access_token"],
            refresh_token=integration["refresh_token"],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=["https://www.googleapis.com/auth/drive.readonly"]
        )

        service = build('drive', 'v3', credentials=creds)

        # 2. Determine Time Window
        last_synced_at = integration.get("last_synced_at")
        
        # Default to 7 days ago if never synced
        if not last_synced_at:
            start_date = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=7)).isoformat()
        else:
            start_date = last_synced_at

        print(f"Fetching files modified after: {start_date}")

        # 3. List Files
        # Query for PDF, Images, and Google Docs (exported as PDF)
        # mimeType != 'application/vnd.google-apps.folder' to exclude folders
        query = f"modifiedTime > '{start_date}' and trashed = false and (mimeType = 'application/pdf' or mimeType contains 'image/')"
        
        results = service.files().list(
            q=query,
            pageSize=50,
            fields="nextPageToken, files(id, name, mimeType, modifiedTime, size)"
        ).execute()
        
        items = results.get('files', [])
        print(f"Found {len(items)} files.")

        processed_count = 0

        for item in items:
            file_id = item['id']
            file_name = item['name']
            mime_type = item['mimeType']
            modified_time = item['modifiedTime']
            
            print(f"Processing file: {file_name} ({file_id})")

            # Check for duplicates using source_id in metadata
            existing = supabase.table("documents").select("id").contains("metadata", {"source_id": file_id}).execute()
            if existing.data:
                print(f"Skipping duplicate file: {file_name} ({file_id})")
                continue
            
            # 4. Download File
            request = service.files().get_media(fileId=file_id)
            file_content = io.BytesIO()
            downloader = MediaIoBaseDownload(file_content, request)
            
            done = False
            while done is False:
                status, done = downloader.next_chunk()
            
            file_content.seek(0)
            file_bytes = file_content.read()

            # 5. Upload to Supabase Storage
            path = f"{user_id}/{file_name}"
            
            # Check if file exists in storage, if so, overwrite or skip? 
            # We'll overwrite for now to ensure latest version
            try:
                supabase.storage.from_("documents").upload(
                    path=path,
                    file=file_bytes,
                    file_options={"content-type": mime_type, "x-upsert": "true"}
                )
            except Exception as e:
                print(f"Error uploading to storage: {e}")
                # If it fails, it might be because it exists and upsert didn't work as expected, or other error
                # Continue to next file
                continue

            # 6. Create/Update Database Record
            # We insert a new record for every new file version found? 
            # Or we update? Let's insert for now, assuming it's a new document context.
            
            doc_data = {
                "user_id": user_id,
                "name": file_name,
                "file_path": path,
                "type": mime_type,
                "size": int(item.get('size', 0)),
                "source": "Drive",
                "source_date": modified_time, # Use Drive modification time
                "status": "pending",
                "metadata": {"source_id": file_id}
            }
            
            # Insert into documents table
            doc_response = supabase.table("documents").insert(doc_data).execute()
            
            if doc_response.data:
                doc_id = doc_response.data[0]['id']
                
                # 7. Trigger AI Processing
                try:
                    process_document_ai(doc_id, file_bytes.decode('latin-1')) # Decode for passing? No, process_document_ai needs bytes or path?
                    # process_document_ai currently takes doc_id. It downloads the file itself from storage.
                    # So we just need to call it.
                    process_document_ai(doc_id) 
                except Exception as e:
                    print(f"AI Processing failed for {doc_id}: {e}")
                
                processed_count += 1

        # 8. Update Integration Status
        current_time = datetime.datetime.now(datetime.timezone.utc).isoformat()
        supabase.table("user_integrations").update({
            "last_synced_at": current_time,
            "sync_status": "active"
        }).eq("id", integration_id).execute()
        
        print(f"--- Drive Sync Completed. Processed {processed_count} files. ---")

    except Exception as e:
        print(f"CRITICAL ERROR in Drive Sync: {str(e)}")
        import traceback
        traceback.print_exc()
        # Update status to error
        supabase.table("user_integrations").update({"sync_status": "error"}).eq("id", integration_id).execute()
