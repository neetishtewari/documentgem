from fastapi import APIRouter, Depends, HTTPException
from app.services.supabase import supabase
from app.dependencies.auth import get_current_user
from app.core.logging_config import get_logger
from collections import Counter
from datetime import datetime, timedelta

logger = get_logger(__name__)
router = APIRouter()

@router.get("/summary")
def get_analytics_summary(user = Depends(get_current_user)):
    logger.debug("Analytics summary requested", extra={"user_id": str(user.id)})
    try:
        # Fetch all documents for the user (excluding duplicates for accurate stats)
        response = supabase.table("documents").select("size, category, source").eq("user_id", user.id).eq("is_duplicate", False).execute()
        documents = response.data
        
        total_docs = len(documents)
        total_storage = sum(doc['size'] for doc in documents)
        
        # Category Breakdown
        categories = [doc['category'] or 'Uncategorized' for doc in documents]
        category_counts = Counter(categories)
        category_data = [{"name": k, "value": v} for k, v in category_counts.items()]
        
        # Source Breakdown
        sources = [doc['source'] or 'Upload' for doc in documents]
        source_counts = Counter(sources)
        source_data = [{"name": k, "value": v} for k, v in source_counts.items()]
        
        return {
            "total_documents": total_docs,
            "total_storage_bytes": total_storage,
            "category_distribution": category_data,
            "source_distribution": source_data
        }
    except Exception as e:
        logger.error("Failed to get analytics summary", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics summary.")

@router.get("/trends")
def get_analytics_trends(user = Depends(get_current_user)):
    try:
        # Fetch creation dates for all documents (excluding duplicates)
        # Limit to last 30 days for now, or fetch all? Let's fetch all and bucket in Python for simplicity
        response = supabase.table("documents").select("created_at").eq("user_id", user.id).eq("is_duplicate", False).order("created_at").execute()
        documents = response.data
        
        if not documents:
            return []

        # Bucket by Date
        date_counts = Counter()
        for doc in documents:
            # Parse ISO format and get YYYY-MM-DD
            # Robust fix: Just take the first 10 chars (YYYY-MM-DD) since we want UTC date anyway
            # and Supabase returns ISO string.
            if doc.get('created_at'):
                date_str = doc['created_at'][:10]
                date_counts[date_str] += 1
            
        # Fill in missing dates if we want a continuous line? 
        # For now, let's just return the data points we have, sorted.
        sorted_dates = sorted(date_counts.keys())
        
        trend_data = [{"date": date, "count": date_counts[date]} for date in sorted_dates]
        
        return trend_data
    except Exception as e:
        logger.error("Failed to get analytics trends", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve analytics trends.")
