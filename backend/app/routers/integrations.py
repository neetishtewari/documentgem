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

router = APIRouter()

# Allow HTTP for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

CLIENT_CONFIG = {
    "web": {
        "client_id": os.getenv("GOOGLE_CLIENT_ID"),
        "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
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

@router.get("/auth/google/url")
def get_google_auth_url(lookback_days: int = 90, custom_date: str = None):
    try:
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri=os.getenv("GOOGLE_REDIRECT_URI")
        )
        
        state_data = {
            "lookback_days": lookback_days,
            "custom_date": custom_date
        }
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=json.dumps(state_data)
        )
        
        return {"url": authorization_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/auth/google/callback")
def google_auth_callback(request: Request, code: str, state: str = None):
    try:
        return RedirectResponse(url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/integrations/callback?code={code}&state={state}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/integrations/google/connect")
def connect_google(
    payload: dict,
    background_tasks: BackgroundTasks,
    user = Depends(get_current_user)
):
    print(f"Connect Google called for user: {user.id}")
    code = payload.get("code")
    config = payload.get("config", {})
    
    try:
        print("Initializing Flow...")
        flow = Flow.from_client_config(
            CLIENT_CONFIG,
            scopes=SCOPES,
            redirect_uri=os.getenv("GOOGLE_REDIRECT_URI")
        )
        
        print(f"Fetching token with code: {code[:10]}...")
        flow.fetch_token(code=code)
        credentials = flow.credentials
        print("Token fetched successfully.")
        
        # Save to DB
        data = {
            "user_id": user.id,
            "provider": "google", 
            "access_token": credentials.token,
            "refresh_token": credentials.refresh_token,
            "config": config
        }
        
        print("Checking existing integration...")
        # Check if exists
        existing = supabase.table("user_integrations").select("*").eq("user_id", user.id).eq("provider", "google").execute()
        
        integration_id = None
        
        if existing.data:
            print("Updating existing integration...")
            integration_id = existing.data[0]['id']
            supabase.table("user_integrations").update(data).eq("id", integration_id).execute()
        else:
            print("Inserting new integration...")
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

@router.get("/integrations/status")
def get_integrations_status(user = Depends(get_current_user)):
    try:
        response = supabase.table("user_integrations").select("*").eq("user_id", user.id).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/integrations/{integration_id}")
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
@router.post("/integrations/{integration_id}/sync")
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
