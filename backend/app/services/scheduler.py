from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.gmail_service import sync_all_integrations

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Schedule sync every 3 hours (180 minutes)
    scheduler.add_job(sync_all_integrations, 'interval', minutes=180)
    scheduler.start()
    print("Scheduler started: Sync running every 3 hours.")
