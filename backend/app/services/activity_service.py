from app.services.supabase import supabase
from app.core.logging_config import get_logger
import uuid

logger = get_logger(__name__)

async def log_activity(user_id: str, action: str, entity_type: str, entity_id: str = None, details: dict = {}):
    """
    Logs a user activity to the database.
    
    Args:
        user_id: The ID of the user performing the action.
        action: The action performed (e.g., "UPLOAD", "DELETE", "RESTORE").
        entity_type: The type of entity affected (e.g., "DOCUMENT", "ALERT").
        entity_id: The ID of the entity (optional).
        details: Additional details about the action (optional).
    """
    try:
        data = {
            "user_id": user_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details
        }
        
        supabase.table("activity_logs").insert(data).execute()
        
    except Exception as e:
        logger.warning(f"Failed to log activity: {e}")
