from fastapi import APIRouter, Depends, HTTPException
from app.services.supabase import supabase
from app.dependencies.auth import get_current_user

router = APIRouter()

@router.get("/")
def get_activity_logs(user = Depends(get_current_user)):
    """
    Get activity logs for the current user.
    """
    try:
        response = supabase.table("activity_logs").select("*").eq("user_id", user.id).order("created_at", desc=True).limit(50).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
