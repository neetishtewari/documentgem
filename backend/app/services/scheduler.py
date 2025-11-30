from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.gmail_service import sync_all_integrations

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Schedule sync every 5 minutes
    scheduler.add_job(sync_all_integrations, 'interval', minutes=5)
    scheduler.start()
    print("Scheduler started: Gmail sync running every 5 minutes.")
