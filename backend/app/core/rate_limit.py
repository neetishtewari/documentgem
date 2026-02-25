"""
Rate limiting configuration using slowapi.
Keyed per-user (via JWT) to prevent abuse and OpenAI cost attacks.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def _get_user_key(request: Request) -> str:
    """Extract user identifier for rate limiting.
    Falls back to IP if no auth header is present."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        # Use a hash of the token as the key (avoids storing raw tokens)
        import hashlib
        token_hash = hashlib.sha256(auth_header[7:].encode()).hexdigest()[:16]
        return f"user:{token_hash}"
    return f"ip:{get_remote_address(request)}"


limiter = Limiter(key_func=_get_user_key)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom 429 response when rate limit is exceeded."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many requests. Please slow down.",
            "retry_after": str(exc.detail),
        },
    )
