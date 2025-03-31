from typing import Optional
import logging

from .config import init_config, get_settings
from .database import init_db
from .logging import setup_logging
from .job_runner import init_job_runner
from .search import init_search_service
from .notifications import init_notification_service
from .git import init_git_service

def init_services() -> None:
    """Initialize all application services.
    
    This function should be called at application startup to set up all
    required services in the correct order.
    """
    # Initialize configuration first
    init_config()
    settings = get_settings()
    
    # Set up logging
    setup_logging(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        log_file=settings.LOG_FILE
    )
    
    # Initialize database (using in-memory store)
    init_db()
    
    # Initialize other services
    init_job_runner()  # Initialize job runner
    init_search_service()
    init_notification_service()
    init_git_service() 