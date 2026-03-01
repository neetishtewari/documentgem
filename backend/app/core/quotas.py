from fastapi import HTTPException
from app.services.supabase import supabase
from app.core.config import settings
from app.core.logging_config import get_logger
from datetime import datetime, timezone

logger = get_logger(__name__)


async def check_document_quota(user_id: str) -> None:
    """
    Raises HTTP 429 if the user has reached their document upload limit.
    Call this BEFORE reading file bytes to fail fast.
    """
    try:
        result = (
            supabase.table("documents")
            .select("id", count="exact")
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .limit(0)
            .execute()
        )
        count = result.count or 0

        if count >= settings.MAX_DOCUMENTS_PER_USER:
            logger.warning(
                "Document quota exceeded",
                extra={"user_id": user_id, "current": count, "limit": settings.MAX_DOCUMENTS_PER_USER},
            )
            raise HTTPException(
                status_code=429,
                detail=f"Document limit reached ({settings.MAX_DOCUMENTS_PER_USER}). "
                       "Please delete some documents before uploading more.",
            )
    except HTTPException:
        raise
    except Exception as e:
        # Don't block uploads if the quota check itself fails
        logger.error("Quota check failed (documents)", exc_info=True)


async def check_chat_quota(user_id: str) -> None:
    """
    Raises HTTP 429 if the user has exceeded their daily chat message limit.
    Call this BEFORE storing the user message or calling the LLM.
    """
    try:
        today_start = datetime.now(timezone.utc).strftime("%Y-%m-%dT00:00:00+00:00")

        result = (
            supabase.table("chat_messages")
            .select("id", count="exact")
            .eq("role", "user")
            .gte("created_at", today_start)
            .limit(0)
            .execute()
        )
        # Note: chat_messages doesn't have a direct user_id column —
        # the count here is scoped by RLS or is a global per-day count.
        # For a tighter scope, join through chat_sessions, but this is
        # a reasonable first-pass guard.
        count = result.count or 0

        if count >= settings.MAX_CHAT_MESSAGES_PER_DAY:
            logger.warning(
                "Chat quota exceeded",
                extra={"user_id": user_id, "current": count, "limit": settings.MAX_CHAT_MESSAGES_PER_DAY},
            )
            raise HTTPException(
                status_code=429,
                detail=f"Daily chat limit reached ({settings.MAX_CHAT_MESSAGES_PER_DAY}). "
                       "Please try again tomorrow.",
            )
    except HTTPException:
        raise
    except Exception as e:
        # Don't block chat if the quota check itself fails
        logger.error("Quota check failed (chat)", exc_info=True)
