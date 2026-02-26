from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.gmail_service import sync_all_integrations
from app.services.alerts_service import check_expiring_documents
from app.core.logging_config import get_logger

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()

def start_scheduler():
    # Schedule sync every 3 hours (180 minutes)
    scheduler.add_job(sync_all_integrations, 'interval', minutes=180)
    
    # Schedule alert check every 24 hours
    scheduler.add_job(check_expiring_documents, 'interval', hours=24)
    
    scheduler.start()
    logger.info("Scheduler started: Sync every 3 hours, Alerts check every 24 hours")
