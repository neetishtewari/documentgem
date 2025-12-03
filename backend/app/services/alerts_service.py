from app.services.supabase import supabase
from datetime import datetime, timedelta, timezone
import json

async def check_expiring_documents():
    """
    Scans documents for expiry dates and creates alerts.
    """
    print("Running check_expiring_documents...")
    try:
        # Fetch documents with metadata and summary
        response = supabase.table("documents").select("id, name, user_id, metadata, summary").not_.is_("metadata", "null").execute()
        documents = response.data
        
        today = datetime.now(timezone.utc).date()
        warning_threshold = today + timedelta(days=7) # Alert if expiring within 7 days
        
        alerts_created = 0
        
        for doc in documents:
            try:
                metadata = doc.get("metadata", {})
                
                if isinstance(metadata, str):
                    try:
                        metadata = json.loads(metadata)
                    except:
                        print(f"Failed to parse metadata for doc {doc['id']}")
                        continue
                
                if not isinstance(metadata, dict):
                    continue
                    
                # 1. Date Checks (Expiry, Due, etc.)
                dates = metadata.get("dates", [])
                if isinstance(dates, list):
                    for date_item in dates:
                        if not isinstance(date_item, dict):
                            continue
                            
                        label = date_item.get("label", "").lower()
                        value = date_item.get("value", "")
                        
                        if any(kw in label for kw in ["expiry", "expiration", "due", "termination", "end"]):
                            try:
                                expiry_date = datetime.strptime(value, "%Y-%m-%d").date()
                                if expiry_date <= warning_threshold:
                                    await create_alert(doc["user_id"], doc["id"], "expiry", f"Document '{doc['name']}' is expiring/due on {value} ({label}).")
                            except ValueError:
                                continue

                # 2. High Value Invoices (> $100,000)
                amounts = metadata.get("amounts", [])
                if isinstance(amounts, list):
                    for amount in amounts:
                        if not isinstance(amount, dict):
                            continue
                        
                        try:
                            # Clean value string (remove currency symbols, commas)
                            val_str = str(amount.get("value", "")).replace(",", "").replace("$", "").replace("₹", "")
                            val = float(val_str)
                            
                            if val > 100000:
                                await create_alert(doc["user_id"], doc["id"], "high_value", f"High value document detected: {amount.get('currency', '$')}{val:,.2f}")
                        except ValueError:
                            continue

                # 3. Missing Signatures
                # Check action items or summary
                action_items = metadata.get("action_items", [])
                summary = doc.get("summary", "") or ""
                
                missing_sig = False
                if isinstance(action_items, list):
                    for item in action_items:
                        if "sign" in str(item).lower() and "missing" in str(item).lower():
                            missing_sig = True
                            break
                
                if not missing_sig and "missing signature" in summary.lower():
                    missing_sig = True
                    
                if missing_sig:
                    await create_alert(doc["user_id"], doc["id"], "missing_signature", f"Document '{doc['name']}' appears to be missing a signature.")

                # 4. Auto-Renewal
                # Check summary or explicit metadata field if we had one
                if "auto-renew" in summary.lower() or "automatic renewal" in summary.lower():
                     await create_alert(doc["user_id"], doc["id"], "auto_renewal", f"Document '{doc['name']}' has an auto-renewal clause.")

            except Exception as e:
                print(f"Error processing doc {doc.get('id')}: {e}")
                continue
                        
        print(f"Alert check complete.")
        
    except Exception as e:
        print(f"Error checking expiring documents: {e}")

async def create_alert(user_id, document_id, type_, message):
    try:
        # Check for existing alert to avoid spam
        existing = supabase.table("alerts").select("id").eq("document_id", document_id).eq("type", type_).eq("is_read", False).execute()
        
        if not existing.data:
            supabase.table("alerts").insert({
                "user_id": user_id,
                "document_id": document_id,
                "type": type_,
                "message": message
            }).execute()
            print(f"Created alert: {type_} - {message}")
    except Exception as e:
        print(f"Error creating alert: {e}")
