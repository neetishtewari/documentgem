from app.services.supabase import supabase
from app.services.ai_service import client
from app.services.alerts_service import create_alert
import json

class CrossCheckService:
    async def check_document(self, doc_id: str):
        """
        Orchestrates cross-document checks for a newly processed document.
        """
        print(f"Running cross-check for document {doc_id}...")
        try:
            # 1. Fetch the document
            response = supabase.table("documents").select("*").eq("id", doc_id).execute()
            if not response.data:
                return
            doc = response.data[0]
            
            # 2. Determine checks based on category/metadata
            category = doc.get("category", "").lower()
            metadata = doc.get("metadata", {}) or {}
            
            if category == "invoice":
                await self.check_invoice_vs_po(doc, metadata)
                await self.check_invoice_vs_contract(doc, metadata)
            elif category == "receipt":
                await self.check_receipt_vs_policy(doc, metadata)
                
        except Exception as e:
            print(f"Error in cross-check service: {e}")

    async def check_invoice_vs_po(self, invoice, metadata):
        """
        Finds related PO and compares them.
        """
        po_number = metadata.get("po_number")
        if not po_number:
            return

        print(f"Looking for PO {po_number}...")
        # Search for the PO document
        # We look for documents where metadata->po_number matches OR name contains PO number
        # Note: Supabase JSONB filtering can be tricky. 
        # For simplicity, let's try to find a document with category 'Purchase Order' and matching PO number in metadata
        
        # Using a broad search first
        response = supabase.table("documents").select("*").eq("category", "Purchase Order").execute()
        potential_pos = response.data
        
        matched_po = None
        for po in potential_pos:
            po_meta = po.get("metadata", {}) or {}
            # Check explicit PO number or if PO number is in the filename
            if po_meta.get("po_number") == po_number or po_number in po.get("name", ""):
                matched_po = po
                break
        
        if matched_po:
            print(f"Found related PO: {matched_po['name']}")
            await self.compare_documents(invoice, matched_po, "Invoice vs Purchase Order", 
                                         "Check for discrepancies in line items, quantities, and unit prices.")

    async def check_receipt_vs_policy(self, receipt, metadata):
        """
        Checks receipt against company policies.
        """
        # Fetch all policy documents
        response = supabase.table("documents").select("*").eq("category", "Policy").execute()
        policies = response.data
        
        if not policies:
            return

        # We might have multiple policies (Travel, Expense, etc.)
        # For now, compare against all of them (or the most relevant one if we could determine it)
        # To save tokens, maybe we concatenate summaries? Or just pick the first 'Expense' policy.
        
        # Limit to top 3 for performance
        for policy in policies[:3]:
            if "expense" in policy.get("name", "").lower() or "travel" in policy.get("name", "").lower() or "policy" in policy.get("name", "").lower():
                print(f"Checking receipt against policy: {policy['name']}")
                await self.compare_documents(receipt, policy, "Receipt vs Policy", 
                                             "Check if the receipt violates any expense limits or disallowed items in the policy.")

    async def check_invoice_vs_contract(self, invoice, metadata):
        """
        Checks invoice against vendor contract.
        """
        vendor = metadata.get("vendor_name")
        if not vendor:
            return
            
        # Find contract for this vendor
        response = supabase.table("documents").select("*").eq("category", "Contract").ilike("name", f"%{vendor}%").execute()
        contracts = response.data
        
        if contracts:
            contract = contracts[0] # Take the first match
            print(f"Found contract for {vendor}: {contract['name']}")
            await self.compare_documents(invoice, contract, "Invoice vs Contract", 
                                         "Check if invoice terms (payment terms, rates) match the contract.")

    async def compare_documents(self, doc_a, doc_b, check_type, instruction):
        """
        Uses LLM to compare two documents.
        """
        try:
            # We need the text content. If it's not stored, we might need to re-download or rely on summary/metadata.
            # Ideally, we should have stored the text or have a way to get it.
            # For now, let's assume we can use the 'summary' and 'metadata' as a proxy if full text isn't available,
            # BUT for detailed comparison we really need the text.
            # Let's assume we can't easily get full text without re-downloading.
            # Let's use the 'summary' and 'metadata' which are readily available.
            
            content_a = f"Document A ({doc_a['category']}): {doc_a.get('summary', '')}\nMetadata: {doc_a.get('metadata', {})}"
            content_b = f"Document B ({doc_b['category']}): {doc_b.get('summary', '')}\nMetadata: {doc_b.get('metadata', {})}"
            
            prompt = f"""
            Compare the following two documents based on this instruction: "{instruction}"
            
            {content_a}
            
            {content_b}
            
            If you find a discrepancy or violation, return a short, concise alert message describing it.
            If everything looks fine, return "OK".
            """
            
            response = await client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "system", "content": "You are a compliance auditor."},
                    {"role": "user", "content": prompt}
                ]
            )
            
            result = response.choices[0].message.content.strip()
            print(f"Comparison Result ({doc_b['name']}): {result[:100]}...")
            
            if result != "OK" and "OK" not in result[:5]:
                # Create Alert
                await create_alert(doc_a["user_id"], doc_a["id"], "compliance_mismatch", f"{check_type}: {result}")
                
        except Exception as e:
            print(f"Error comparing documents: {e}")

cross_check_service = CrossCheckService()
