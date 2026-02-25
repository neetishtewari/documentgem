from fastapi import APIRouter, Depends, HTTPException, Body
from app.dependencies.auth import get_current_user
from app.services.supabase import supabase
from app.core.logging_config import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.get("/")
def get_settings(user = Depends(get_current_user)):
    """
    Fetch user settings.
    For now, we store settings in a 'user_settings' table or just return defaults/mock.
    Let's assume we want to store them.
    If table doesn't exist, we return defaults.
    """
    try:
        # Check if we have a settings table? 
        # Or just use metadata in auth.users?
        # Let's use a simple dict for now returned to frontend.
        
        # Mock settings for Phase 2
        return {
            "notifications": {
                "email": True,
                "push": False,
                "alerts": True
            },
            "theme": "light"
        }
    except Exception as e:
        logger.error("Failed to get settings", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve settings.")

@router.patch("/")
def update_settings(settings: dict = Body(...), user = Depends(get_current_user)):
    """
    Update user settings.
    """
    try:
        # Just echo back for now as we don't have a settings table yet.
        # In real impl, save to DB.
        return settings
    except Exception as e:
        logger.error("Failed to update settings", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update settings.")
