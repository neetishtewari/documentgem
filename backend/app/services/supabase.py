from supabase import create_client, Client
from app.core.config import settings

# Main client with Service Role (Admin) - Use for DB operations
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Public client with Anon Key - Use for Auth verification
supabase_public: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
