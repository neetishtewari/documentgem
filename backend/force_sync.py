import asyncio
import os
from app.services.supabase import supabase
from app.services.gmail_service import sync_all_integrations

# Mock env vars if needed, but they should be loaded by app imports or system env
# We assume the environment is set up correctly in the shell

async def main():
    print("Forcing immediate sync...")
    await sync_all_integrations()
    print("Sync triggered.")

if __name__ == "__main__":
    asyncio.run(main())
