from app.services.supabase import supabase
import uuid

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
        
        # Fire and forget - we don't want to block the main request if logging fails
        # But since we are in async context, we can just await it or run it as a background task if passed.
        # For simplicity in this service function, we'll just execute it.
        # In a real production app, this might go to a queue.
        
        supabase.table("activity_logs").insert(data).execute()
        
    except Exception as e:
        print(f"Failed to log activity: {e}")
