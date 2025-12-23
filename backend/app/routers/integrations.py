import os
import json
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from app.dependencies.auth import get_current_user
from app.services.supabase import supabase
from app.services.gmail_service import fetch_gmail_attachments
from app.services.drive_service import fetch_drive_files

from app.core.config import settings

router = APIRouter()

# Allow HTTP for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
# Relax scope validation (Google often returns subset of scopes)
os.environ['OAUTHLIB_RELAX_TOKEN_SCOPE'] = '1'

# Use settings for client config
CLIENT_CONFIG = {
    "web": {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
    }
}

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]

# ... existing get_google_auth_url ...
@router.get("/auth/google/url")
def get_google_auth_url(lookback_days: int = 90, custom_date: str = None):
    # This might be redundant if we use auth.py, but keeping for compatibility if anything calls it
    try:
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        # ... logic ...
        return {"url": "Use /api/auth/google/url instead"} 
    except:
        pass

# ... google_auth_callback ...

@router.post("/google/connect")
def connect_google(
    payload: dict,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    print(f"Connect Google called for user: {user.id}")
    code = payload.get("code")
    config = payload.get("config", {})
    provider_type = config.get("provider", "google") # Default to google (gmail) if missing
    
    try:
        print("Initializing Flow...")
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        
        print(f"Fetching token with code: {code[:10]}...")
        flow.fetch_token(code=code)
        credentials = flow.credentials
        print("Token fetched successfully.")
        
        # Save to DB
        data = {
            "user_id": user.id,
            "provider": provider_type, 
            "access_token": credentials.token,
            # "refresh_token": credentials.refresh_token, # Handle conditionally
            "config": config,
            # "sync_status": "connected", # Column does not exist
            # "last_error": None          # Column does not exist
        }

        if credentials.refresh_token:
            data["refresh_token"] = credentials.refresh_token
        else:
            # If Google didn't return a refresh token (happens on incremental auth), 
            # try to find an existing one from another integration (e.g. gmail)
            print("No refresh token returned. Checking other integrations for fallback...")
            fallback = supabase.table("user_integrations").select("refresh_token").eq("user_id", user.id).neq("refresh_token", "null").limit(1).execute()
            if fallback.data and fallback.data[0].get("refresh_token"):
                print("Found existing refresh token. Reusing it.")
                data["refresh_token"] = fallback.data[0]["refresh_token"]
            else:
                print("WARNING: No refresh token found. This integration will fail to sync in 1 hour.")
        
        print(f"Checking existing integration for {provider_type}...")
        # Check if exists
        existing = supabase.table("user_integrations").select("*").eq("user_id", user.id).eq("provider", provider_type).execute()
        
        integration_id = None
        
        if existing.data:
            print("Updating existing integration...")
            integration_id = existing.data[0]['id']
            supabase.table("user_integrations").update(data).eq("id", integration_id).execute()
        else:
            print("Inserting new integration...")
            if "refresh_token" not in data:
                 raise Exception("Google did not provide a refresh token. Please revoke access to DocumentGem in your Google Account settings and try again.")
            
            response = supabase.table("user_integrations").insert(data).execute()
            integration_id = response.data[0]['id']
            
        print("Integration saved successfully.")
        
        # Trigger Background Sync
        if integration_id:
            print(f"Triggering background sync for integration {integration_id}")
            background_tasks.add_task(fetch_gmail_attachments, integration_id, user.id)
            background_tasks.add_task(fetch_drive_files, integration_id, user.id)
            
        return {"status": "success"}
        
    except Exception as e:
        print(f"ERROR in connect_google: {str(e)}")
        import traceback
        traceback.print_exc()
            
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
def get_integrations_status(user = Depends(get_current_user)):
    try:
        response = supabase.table("user_integrations").select("*").eq("user_id", user.id).execute()
        return response.data
    except Exception as e:
        print(f"ERROR in get_integrations_status: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{integration_id}")
def delete_integration(integration_id: str, user = Depends(get_current_user)):
    try:
        # Verify ownership
        response = supabase.table("user_integrations").select("*").eq("id", integration_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Integration not found")
            
        # Delete
        supabase.table("user_integrations").delete().eq("id", integration_id).execute()
        
        return {"message": "Integration deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.post("/{integration_id}/sync")
def sync_integration(
    integration_id: str,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    try:
        # Verify ownership
        response = supabase.table("user_integrations").select("*").eq("id", integration_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Integration not found")
            
        integration = response.data
        
        # Update status to syncing
        supabase.table("user_integrations").update({"sync_status": "syncing"}).eq("id", integration_id).execute()
        
        # Trigger Background Sync
        print(f"Manual sync triggered for integration {integration_id}")
        background_tasks.add_task(fetch_gmail_attachments, integration_id, user.id)
        background_tasks.add_task(fetch_drive_files, integration_id, user.id)
        
        return {"message": "Sync started successfully"}
        
    except Exception as e:
        print(f"Sync Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
