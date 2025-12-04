import asyncio
import uuid
from app.services.supabase import supabase
from app.services.cross_check_service import cross_check_service
from datetime import datetime

async def test_cross_check():
    print("Setting up test data...")
    
    user_id = "test-user-id"
    try:
        # Try to get a real user
        users = supabase.auth.admin.list_users()
        if users:
            user_id = users[0].id
        else:
            print("No users found. Using dummy UUID.")
            user_id = str(uuid.uuid4())
    except Exception as e:
        print(f"Could not list users: {e}. Using dummy UUID.")
        user_id = str(uuid.uuid4())

    # 1. Create Policy Doc
    policy_id = str(uuid.uuid4())
    policy_doc = {
        "id": policy_id,
        "name": "Travel Policy.pdf",
        "category": "Policy",
        "user_id": user_id,
        "summary": "Company Travel Policy. Maximum dinner allowance is $50 per person. Alcohol is not reimbursable.",
        "metadata": {},
        "file_path": "test/policy.pdf",
        "type": "application/pdf",
        "size": 1024
    }
    
    # 2. Create Receipt Doc (Violation: $100 dinner)
    receipt_id = str(uuid.uuid4())
    receipt_doc = {
        "id": receipt_id,
        "name": "Dinner Receipt.pdf",
        "category": "Receipt",
        "user_id": user_id,
        "summary": "Dinner at Steakhouse. Total: $100.00.",
        "metadata": {"amounts": [{"label": "Total", "value": "100.00", "currency": "USD"}]},
        "file_path": "test/receipt.pdf",
        "type": "application/pdf",
        "size": 1024
    }
    
    # 3. Create PO Doc
    po_id = str(uuid.uuid4())
    po_doc = {
        "id": po_id,
        "name": "PO-123 Purchase Order.pdf",
        "category": "Purchase Order",
        "user_id": user_id,
        "summary": "Purchase Order PO-123 for 5 Laptops at $1000 each.",
        "metadata": {"po_number": "PO-123"},
        "file_path": "test/po.pdf",
        "type": "application/pdf",
        "size": 1024
    }
    
    # 4. Create Invoice Doc (Mismatch: $1200 each)
    invoice_id = str(uuid.uuid4())
    invoice_doc = {
        "id": invoice_id,
        "name": "Invoice-001.pdf",
        "category": "Invoice",
        "user_id": user_id,
        "summary": "Invoice for 5 Laptops at $1200 each.",
        "metadata": {"po_number": "PO-123", "invoice_number": "INV-001"},
        "file_path": "test/invoice.pdf",
        "type": "application/pdf",
        "size": 1024
    }
    
    created_ids = [policy_id, receipt_id, po_id, invoice_id]
    
    try:
        print("Inserting test documents...")
        supabase.table("documents").insert([policy_doc, receipt_doc, po_doc, invoice_doc]).execute()
        
        # Run Checks
        # print("\n--- Testing Receipt vs Policy ---")
        # await cross_check_service.check_document(receipt_id)
        
        print("\n--- Testing Invoice vs PO ---")
        await cross_check_service.check_document(invoice_id)
        
        # Verify Alerts
        print("\nVerifying Alerts...")
        # Give a moment for async DB writes if any (though await should handle it)
        await asyncio.sleep(2)
        
        response = supabase.table("alerts").select("*").in_("document_id", [receipt_id, invoice_id]).execute()
        alerts = response.data
        
        print(f"Found {len(alerts)} alerts.")
        for alert in alerts:
            print(f"- [{alert['type']}] {alert['message']}")
            
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        print("\nCleaning up...")
        if created_ids:
            supabase.table("documents").delete().in_("id", created_ids).execute()
            supabase.table("alerts").delete().in_("document_id", created_ids).execute()

if __name__ == "__main__":
    asyncio.run(test_cross_check())
