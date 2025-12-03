from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def auth_root():
    return {"message": "Auth router"}

@router.get("/google/callback")
async def google_callback():
    return {"message": "Google callback placeholder"}
