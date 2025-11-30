from fastapi import APIRouter, Depends, HTTPException
from app.dependencies.auth import get_current_user
from app.services.supabase import supabase
from collections import defaultdict
from datetime import datetime
import re

router = APIRouter()

def parse_amount(amount_str):
    """
    Parses amount string to float. 
    Handles "$1,200.50", "1200", "€ 500", etc.
    """
    if not amount_str:
        return 0.0
    try:
        # Remove currency symbols and commas
        clean_str = re.sub(r'[^\d.]', '', str(amount_str))
        return float(clean_str)
    except:
        return 0.0

@router.get("/insights")
def get_insights(user = Depends(get_current_user)):
    try:
        # 1. Fetch all documents for the user
        # We fetch minimal fields needed for aggregation to be efficient
        response = supabase.table("documents").select("id, name, category, source, created_at, metadata").eq("user_id", user.id).execute()
        documents = response.data
        
        # 2. Initialize Aggregators
        total_spend_this_month = 0.0
        monthly_spend = defaultdict(float)
        category_counts = defaultdict(int)
        source_counts = defaultdict(int)
        upcoming_deadlines = []
        action_items_count = 0
        
        current_month = datetime.now().strftime("%Y-%m")
        
        for doc in documents:
            # --- Category Breakdown ---
            cat = doc.get("category", "Uncategorized")
            category_counts[cat] += 1
            
            # --- Source Breakdown ---
            src = doc.get("source", "Upload")
            source_counts[src] += 1
            
            metadata = doc.get("metadata") or {}
            
            # --- Financials ---
            # Look for amounts in metadata
            amounts = metadata.get("amounts", [])
            doc_date_str = doc.get("created_at")
            
            # Try to find a specific "date" in metadata to attribute the spend to, otherwise use created_at
            # For simplicity, we use created_at for the month bucket, unless we find a better date
            doc_month = doc_date_str[:7] if doc_date_str else current_month
            
            doc_total = 0.0
            
            if amounts:
                for amt in amounts:
                    # If it's a dict with label/value
                    if isinstance(amt, dict):
                        label = amt.get("label", "").lower()
                        value = amt.get("value", "")
                        # Heuristic: if label contains "total" or "amount due"
                        if "total" in label or "due" in label or "amount" in label:
                            val = parse_amount(value)
                            # Assume the largest amount is the total if multiple match?
                            # Or just sum them? Summing might double count (Subtotal + Total).
                            # Let's take the MAX amount found in the doc as the "Total Value" of the doc.
                            doc_total = max(doc_total, val)
                    elif isinstance(amt, str):
                        val = parse_amount(amt)
                        doc_total = max(doc_total, val)
            
            if doc_total > 0:
                monthly_spend[doc_month] += doc_total
                if doc_month == current_month:
                    total_spend_this_month += doc_total

            # --- Deadlines ---
            dates = metadata.get("dates", [])
            if dates:
                for date_item in dates:
                    date_val = ""
                    label = ""
                    if isinstance(date_item, dict):
                        date_val = date_item.get("value")
                        label = date_item.get("label", "Date")
                    elif isinstance(date_item, str):
                        date_val = date_item
                        label = "Date"
                        
                    # Check if it's a future date
                    # Simple string comparison works for ISO dates, but these might be "Oct 12, 2023"
                    # We'll just pass them to frontend to filter/sort for now, or try to parse.
                    # Let's just collect them all and let frontend sort/filter "Upcoming"
                    if "due" in label.lower() or "expiry" in label.lower() or "expire" in label.lower():
                         upcoming_deadlines.append({
                             "doc_id": doc["id"],
                             "doc_name": doc["name"],
                             "label": label,
                             "date": date_val
                         })

            # --- Action Items ---
            actions = metadata.get("action_items", [])
            if actions:
                action_items_count += len(actions)

        # 3. Format for Frontend
        
        # Sort monthly spend by month
        sorted_months = sorted(monthly_spend.keys())
        # Take last 6 months
        recent_months = sorted_months[-6:]
        spend_chart_data = [{"month": m, "amount": monthly_spend[m]} for m in recent_months]
        
        # Format Category Data
        category_chart_data = [{"name": k, "value": v} for k, v in category_counts.items()]
        
        # Format Source Data
        source_chart_data = [{"name": k, "value": v} for k, v in source_counts.items()]

        return {
            "kpi": {
                "total_documents": len(documents),
                "total_spend_this_month": total_spend_this_month,
                "pending_action_items": action_items_count
            },
            "charts": {
                "monthly_spend": spend_chart_data,
                "categories": category_chart_data,
                "sources": source_chart_data
            },
            "deadlines": upcoming_deadlines,
            "recent_activity": documents[:5] # Just the 5 most recent
        }

    except Exception as e:
        print(f"Error generating insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))
