from app.services.supabase import supabase

def check_table():
    try:
        response = supabase.table("alerts").select("id").limit(1).execute()
        print("Table 'alerts' exists.")
    except Exception as e:
        print(f"Table 'alerts' does not exist or error: {e}")

if __name__ == "__main__":
    check_table()
