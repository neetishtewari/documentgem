from app.services.supabase import supabase
import asyncio

def fix_data():
    try:
        # Try to fetch users from auth schema
        # Note: supabase-py might not support schema selection easily for table()
        # But we can try rpc or raw query if available? 
        # Or just try to list users using auth admin api if available?
        # The supabase client has an auth attribute but it's for the current session usually.
        # But with service role, maybe we can list users?
        
        response = supabase.auth.admin.list_users()
        print(f"Response type: {type(response)}")
        # It might be a list of User objects directly?
        if isinstance(response, list):
             users = response
        else:
             # Try to access users attribute if it exists, or print dir
             print(f"Response attributes: {dir(response)}")
             users = getattr(response, 'users', [])
        
        print(f"Found {len(users)} users.")
        
        if not users:
            print("No users found.")
            return

        user_id = users[0].id
        print(f"Using User ID: {user_id}")
        
        # Update documents where user_id is NULL
        update_res = supabase.table("documents").update({"user_id": user_id}).is_("user_id", "null").execute()
        print(f"Updated {len(update_res.data)} documents.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_data()
