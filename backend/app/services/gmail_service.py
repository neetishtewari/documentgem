import os
import datetime
import base64
import uuid
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from fastapi.concurrency import run_in_threadpool
from app.services.supabase import supabase
from app.services.document_processor import process_document_ai

async def fetch_gmail_attachments(integration_id: str, user_id: str):
    """
    Background task to fetch attachments from Gmail and process them.
    """
    print(f"Starting Gmail sync for integration {integration_id}")
    
    try:
        # 1. Get Integration Config & Tokens
        response = supabase.table("user_integrations").select("*").eq("id", integration_id).single().execute()
        integration = response.data
        
        if not integration:
            print(f"Integration {integration_id} not found.")
            return

        # Update status to Scanning
        supabase.table("user_integrations").update({
            "sync_status": "scanning",
            "sync_message": "Scanning emails...",
            "sync_progress": 0,
            "sync_total": 0
        }).eq("id", integration_id).execute()

        # 2. Build Credentials
        creds = Credentials(
            token=integration['access_token'],
            refresh_token=integration['refresh_token'],
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=['https://www.googleapis.com/auth/gmail.readonly']
        )

        # 3. Build Service
        service = build('gmail', 'v1', credentials=creds)

        # 4. Build Query
        config = integration.get('config', {})
        lookback_days = config.get('lookback_days', 90)
        
        # Calculate date
        date_query = ""
        last_synced_at = integration.get('last_synced_at')
        
        if last_synced_at:
            # If previously synced, only get newer emails
            # Ensure we handle the timezone correctly
            try:
                last_sync_dt = datetime.datetime.fromisoformat(last_synced_at.replace('Z', '+00:00'))
                # If the DB stored a naive time that was actually local, we might need to be careful.
                # But moving forward we will store UTC.
                # For query, we need seconds since epoch.
                timestamp = int(last_sync_dt.timestamp())
                date_query = f" after:{timestamp}"
            except Exception as e:
                print(f"Error parsing last_synced_at: {e}")
                # Fallback to lookback days if date parse fails
                start_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=lookback_days)
                date_str = start_date.strftime("%Y/%m/%d")
                date_query = f" after:{date_str}"
                
        elif lookback_days:
            start_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=lookback_days)
            date_str = start_date.strftime("%Y/%m/%d")
            date_query = f" after:{date_str}"
            
        query = f"has:attachment{date_query}"
        print(f"Gmail Query: {query}")

        # 5. List Messages
        results = service.users().messages().list(userId='me', q=query).execute()
        messages = results.get('messages', [])
        
        total_messages = len(messages)
        print(f"Found {total_messages} messages with attachments.")
        
        supabase.table("user_integrations").update({
            "sync_status": "syncing",
            "sync_total": total_messages,
            "sync_message": f"Found {total_messages} emails. Starting download..."
        }).eq("id", integration_id).execute()

        processed_count = 0

        for msg in messages:
            try:
                msg_id = msg['id']
                message = service.users().messages().get(userId='me', id=msg_id).execute()
                
                # Extract Date
                internal_date = int(message.get('internalDate', 0)) / 1000
                email_date = datetime.datetime.fromtimestamp(internal_date, datetime.timezone.utc).isoformat()
                
                parts = message.get('payload', {}).get('parts', [])
                
                for part in parts:
                    if part.get('filename') and part.get('body') and part.get('body').get('attachmentId'):
                        filename = part['filename']
                        mime_type = part['mimeType']
                        attachment_id = part['body']['attachmentId']
                        
                        # Filter for PDF and Images
                        if mime_type not in ['application/pdf', 'image/jpeg', 'image/png']:
                            continue
                            
                        print(f"Processing attachment: {filename}")
                        
                        # Get Attachment Data
                        attachment = service.users().messages().attachments().get(
                            userId='me', messageId=msg_id, id=attachment_id
                        ).execute()
                        
                        data = base64.urlsafe_b64decode(attachment['data'].encode('UTF-8'))
                        
                        # Check for duplicates
                        # We use the message ID as the unique source identifier
                        existing = supabase.table("documents").select("id").contains("metadata", {"source_id": msg_id}).execute()
                        if existing.data:
                            print(f"Skipping duplicate email: {msg_id}")
                            continue

                        # Upload to Storage
                        file_ext = filename.split(".")[-1]
                        file_path = f"{user_id}/{uuid.uuid4()}.{file_ext}"
                        
                        supabase.storage.from_("documents").upload(
                            path=file_path,
                            file=data,
                            file_options={"content-type": mime_type}
                        )
                        
                        # Insert into DB
                        document_data = {
                            "name": filename,
                            "file_path": file_path,
                            "type": mime_type,
                            "size": len(data),
                            "category": "Processing...",
                            "user_id": user_id,
                            "summary": f"Imported from Gmail (Message ID: {msg_id})",
                            "source": "Gmail",
                            "source_date": email_date,
                            "metadata": {"source_id": msg_id}
                        }
                        
                        response = supabase.table("documents").insert(document_data).execute()
                        document_id = response.data[0]['id']
                        
                        # Trigger AI Processing
                        await process_document_ai(document_id, data, mime_type)
                        
                processed_count += 1
                
                # Update progress every 5 items
                if processed_count % 5 == 0:
                    supabase.table("user_integrations").update({
                        "sync_progress": processed_count,
                        "sync_message": f"Processed {processed_count}/{total_messages} emails..."
                    }).eq("id", integration_id).execute()
                    
            except Exception as e:
                print(f"Error processing message {msg_id}: {e}")
                continue

        # 6. Finish
        supabase.table("user_integrations").update({
            "sync_status": "completed",
            "sync_message": "Sync completed successfully.",
            "sync_progress": total_messages,
            "last_synced_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }).eq("id", integration_id).execute()
        
        print("Gmail sync completed.")

    except Exception as e:
        print(f"CRITICAL GMAIL SYNC ERROR: {e}")
        import traceback
        traceback.print_exc()
        supabase.table("user_integrations").update({
            "sync_status": "error",
            "sync_message": f"Error: {str(e)}"
        }).eq("id", integration_id).execute()

from app.services.drive_service import fetch_drive_files

async def sync_all_integrations():
    """
    Iterates through all active integrations and triggers sync.
    """
    print("Running scheduled sync for all integrations...")
    try:
        # Fetch all google integrations
        response = supabase.table("user_integrations").select("*").eq("provider", "google").execute()
        integrations = response.data
        
        for integration in integrations:
            # We can run these in parallel or sequentially.
            # For simplicity, sequential await here.
            
            # 1. Sync Gmail
            await fetch_gmail_attachments(integration['id'], integration['user_id'])
            
            # 2. Sync Drive (if scopes allow)
            # We assume if provider is google, it might have drive access. 
            # The fetch_drive_files function will handle auth errors if scopes are missing?
            # Or we can check scopes if we stored them. 
            # For now, just try it.
            try:
                # fetch_drive_files is sync, so we run it directly or in threadpool?
                # It is blocking, so ideally run_in_threadpool.
                await run_in_threadpool(fetch_drive_files, integration['id'], integration['user_id'])
            except Exception as e:
                print(f"Drive sync failed for {integration['id']}: {e}")
            
    except Exception as e:
        print(f"Error in sync_all_integrations: {e}")
