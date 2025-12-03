from app.services.supabase import supabase
from datetime import datetime, timedelta, timezone

async def check_expiring_documents():
    """
    Scans documents for expiry dates and creates alerts.
    """
    print("Running check_expiring_documents...")
    try:
        # Fetch documents with metadata
        # We can filter by category if needed, but let's check all.
        # Pagination might be needed for large datasets, but for now fetch all.
        response = supabase.table("documents").select("id, name, user_id, metadata").not_.is_("metadata", "null").execute()
        documents = response.data
        
        today = datetime.now(timezone.utc).date()
        warning_threshold = today + timedelta(days=7) # Alert if expiring within 7 days
        
        alerts_created = 0
        
        for doc in documents:
            metadata = doc.get("metadata", {})
            if not metadata:
                continue
                
            dates = metadata.get("dates", [])
            if not isinstance(dates, list):
                continue
                
            for date_item in dates:
                label = date_item.get("label", "").lower()
                value = date_item.get("value", "")
                
                # Check for keywords
                if any(kw in label for kw in ["expiry", "expiration", "due", "termination", "end"]):
                    try:
                        # Parse date (assuming YYYY-MM-DD from AI)
                        expiry_date = datetime.strptime(value, "%Y-%m-%d").date()
                        
                        # Check if within range (Today <= Expiry <= Threshold)
                        # We also want to alert if it's already expired? Yes.
                        if expiry_date <= warning_threshold:
                            # Create Alert
                            message = f"Document '{doc['name']}' is expiring/due on {value} ({label})."
                            type_ = "expiry"
                            
                            # Check for existing alert to avoid spam
                            # We check if an alert for this doc and type exists created in the last 3 days?
                            # Or just if ANY unread alert exists?
                            existing = supabase.table("alerts").select("id").eq("document_id", doc["id"]).eq("type", type_).eq("is_read", False).execute()
                            
                            if not existing.data:
                                supabase.table("alerts").insert({
                                    "user_id": doc["user_id"],
                                    "document_id": doc["id"],
                                    "type": type_,
                                    "message": message
                                }).execute()
                                alerts_created += 1
                                
                    except ValueError:
                        continue # Skip invalid dates
                        
        print(f"Alert check complete. Created {alerts_created} alerts.")
        
    except Exception as e:
        print(f"Error checking expiring documents: {e}")
