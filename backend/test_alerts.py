import asyncio
from app.services.supabase import supabase
from app.services.alerts_service import check_expiring_documents
from datetime import datetime, timedelta
import uuid

async def test_alerts():
    print("Setting up test data...")
    
    # 1. Get a user
    users = supabase.auth.admin.list_users()
    if isinstance(users, list):
         user_list = users
    else:
         user_list = getattr(users, 'users', [])
         
    if not user_list:
        print("No users found to test with.")
        return
        
    user_id = user_list[0].id
    
    # 2. Create dummy documents
    docs_to_create = []
    
    # Expiry Doc
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    docs_to_create.append({
        "id": str(uuid.uuid4()),
        "name": "Test Expiry.pdf",
        "file_path": "test/expiry.pdf",
        "type": "application/pdf",
        "size": 1024,
        "category": "Contract",
        "user_id": user_id,
        "metadata": {
            "dates": [{"label": "Expiry Date", "value": tomorrow}]
        }
    })
    
    # High Value Doc
    docs_to_create.append({
        "id": str(uuid.uuid4()),
        "name": "Test High Value.pdf",
        "file_path": "test/highval.pdf",
        "type": "application/pdf",
        "size": 1024,
        "category": "Invoice",
        "user_id": user_id,
        "metadata": {
            "amounts": [{"label": "Total", "value": "150,000.00", "currency": "USD"}]
        }
    })
    
    # Missing Signature Doc
    docs_to_create.append({
        "id": str(uuid.uuid4()),
        "name": "Test Missing Sig.pdf",
        "file_path": "test/nosig.pdf",
        "type": "application/pdf",
        "size": 1024,
        "category": "Contract",
        "user_id": user_id,
        "metadata": {
            "action_items": ["Missing signature from Client"]
        },
        "summary": "Contract is pending missing signature."
    })
    
    # Auto Renewal Doc
    docs_to_create.append({
        "id": str(uuid.uuid4()),
        "name": "Test Auto Renew.pdf",
        "file_path": "test/renew.pdf",
        "type": "application/pdf",
        "size": 1024,
        "category": "Contract",
        "user_id": user_id,
        "metadata": {},
        "summary": "This agreement includes an automatic renewal clause."
    })
    
    created_ids = [d["id"] for d in docs_to_create]
    
    try:
        print(f"Inserting {len(docs_to_create)} test documents...")
        supabase.table("documents").insert(docs_to_create).execute()
        
        # 3. Run alert check
        print("Running alert check...")
        await check_expiring_documents()
        
        # 4. Verify alerts exist
        print("Verifying alert creation...")
        response = supabase.table("alerts").select("*").in_("document_id", created_ids).execute()
        alerts = response.data
        
        print(f"Found {len(alerts)} alerts (Expected 4).")
        for alert in alerts:
            print(f"- [{alert['type']}] {alert['message']}")
            
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        # Cleanup
        print("Cleaning up...")
        if created_ids:
            supabase.table("documents").delete().in_("id", created_ids).execute()
            supabase.table("alerts").delete().in_("document_id", created_ids).execute()

if __name__ == "__main__":
    asyncio.run(test_alerts())
