import json
from fastapi import APIRouter, HTTPException
from google_auth_oauthlib.flow import Flow
from app.core.config import settings

router = APIRouter()

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/drive.readonly'
]

@router.get("/google/url")
async def get_google_auth_url(lookback_days: int = 90, custom_date: str = None, provider: str = "gmail"):
    """
    Generates the Google OAuth2 consent URL.
    """
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Client ID/Secret not configured.")

    try:
        # Create the flow using the client secrets
        # Note: In a real app we'd load this from a file or dict
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "project_id": "documentgem", # Placeholder
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [settings.GOOGLE_REDIRECT_URI]
            }
        }
        
        flow = Flow.from_client_config(
            client_config,
            scopes=SCOPES,
            redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        
        # Determine state data
        state_data = {
            "lookbackDays": lookback_days,
            "customDate": custom_date,
            "provider": provider
        }
        
        # Generate URL
        auth_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent', # Force consent to ensure we get a refresh token
            # Pass state as JSON string
            state=json.dumps(state_data)
        )
        
        return {"url": auth_url}
        
    except Exception as e:
        from app.core.logging_config import get_logger
        get_logger(__name__).error(f"Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate authentication URL.")

@router.get("/google/callback")
async def google_callback(code: str, state: str = None):
    # Redirect to frontend callback page
    redirect_url = f"{settings.FRONTEND_URL}/integrations/callback?code={code}&state={state}"
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=redirect_url)
