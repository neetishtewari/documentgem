import asyncio
import os
from app.services.supabase import supabase
from app.core.config import settings
from supabase import create_client

async def verify():
    print("--- Testing RLS / Key Hypothesis ---")
    try:
        user_id = "1b8e4635-aae7-4e9d-9543-b2ff1a1820bd"
        
        # 1. Test with Service Role Key (Should Work)
        print("1. Using Service Role Key (Admin):")
        # Reuse existing client
        count1 = supabase.table("documents").select("id", count="exact").eq("user_id", user_id).execute().count
        print(f"   Count: {count1}")
        
        # 2. Test with Anon Key (Should Fail/Return 0 if RLS catches it)
        print("\n2. Using Anon Key (Public) without User Token:")
        anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        count2 = anon_client.table("documents").select("id", count="exact").eq("user_id", user_id).execute().count
        print(f"   Count: {count2}")
        
        if count1 > 0 and count2 == 0:
            print("\n*** HYPOTHESIS CONFIRMED ***")
            print("Accessing DB with Anon Key (without user token) returns 0 results.")
            print("If Production environment has incorrect SUPABASE_SERVICE_ROLE_KEY (e.g. set to Anon Key), this explains the bug.")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify())
