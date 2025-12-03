from app.services.supabase import supabase
from collections import Counter
from datetime import datetime

def test_trends():
    try:
        # Get user
        response = supabase.auth.admin.list_users()
        if isinstance(response, list):
             users = response
        else:
             users = getattr(response, 'users', [])
        
        if not users:
            print("No users found")
            return
            
        user_id = users[0].id
        print(f"Testing for user: {user_id}")
        
        # Logic from analytics.py
        response = supabase.table("documents").select("created_at").eq("user_id", user_id).eq("is_duplicate", False).order("created_at").execute()
        documents = response.data
        print(f"Found {len(documents)} documents")
        
        if not documents:
            print("No documents")
            return

        # Bucket by Date
        date_counts = Counter()
        for doc in documents:
            print(f"Processing: {doc['created_at']}")
            # Parse ISO format and get YYYY-MM-DD
            if doc.get('created_at'):
                date_str = doc['created_at'][:10]
                date_counts[date_str] += 1
            
        sorted_dates = sorted(date_counts.keys())
        trend_data = [{"date": date, "count": date_counts[date]} for date in sorted_dates]
        print("Success:", trend_data)
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")

if __name__ == "__main__":
    test_trends()
