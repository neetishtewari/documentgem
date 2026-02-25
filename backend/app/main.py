import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging_config import setup_logging, get_logger
from app.core.rate_limit import limiter, rate_limit_exceeded_handler

# --- Initialize logging ---
setup_logging(settings.ENVIRONMENT)
logger = get_logger(__name__)

app = FastAPI(
    title="Document Intelligence Platform API",
    docs_url="/docs" if not settings.is_production else None,  # Disable Swagger in prod
    redoc_url="/redoc" if not settings.is_production else None,
)

# --- Rate Limiting ---
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# --- CORS ---
origins = [
    "http://localhost:3000",
    "https://documentgem.vercel.app",
    os.getenv("FRONTEND_URL", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin for origin in origins if origin],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


# --- Security Headers Middleware ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


app.add_middleware(SecurityHeadersMiddleware)

# --- Routers ---
from app.routers import auth, documents, chat, integrations, analytics, search

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(search.router, prefix="/api", tags=["search"])

from app.routers import settings as settings_router, activity
app.include_router(settings_router.router, prefix="/api/settings", tags=["settings"])
app.include_router(activity.router, prefix="/api/activity", tags=["activity"])

from app.services.scheduler import start_scheduler


@app.on_event("startup")
async def startup_event():
    start_scheduler()
    logger.info("Application started", extra={"environment": settings.ENVIRONMENT})


@app.get("/")
async def root():
    return {"message": "Document Intelligence Platform API", "status": "running"}


@app.get("/health")
async def health_check():
    """Production health check — verifies DB connectivity."""
    from app.services.supabase import supabase
    try:
        result = supabase.table("documents").select("id", count="exact").limit(0).execute()
        return {
            "status": "healthy",
            "database": "connected",
            "environment": settings.ENVIRONMENT,
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "database": "disconnected"},
        )
