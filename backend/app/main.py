import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Document Intelligence Platform API")

# Configure CORS
origins = [
    "http://localhost:3000",
    "https://documentgem.vercel.app",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.routers import auth, documents, chat, integrations, analytics, search

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(search.router, prefix="/api", tags=["search"])

from app.routers import settings, activity
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])

from app.services.scheduler import start_scheduler

@app.on_event("startup")
async def startup_event():
    start_scheduler()

@app.get("/")
async def root():
    return {"message": "Welcome to Agentic Coding Platform API"}
