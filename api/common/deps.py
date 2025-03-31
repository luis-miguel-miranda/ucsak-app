from typing import Generator, Optional
from fastapi import Depends, HTTPException, status

from .database import get_db, InMemorySession
from .config import get_settings, Settings
from .notifications import get_notification_service, NotificationService
from .search import get_search_service, SearchService
from .job_runner import get_job_runner, JobRunner
from .git import get_git_service, GitService

def get_settings_dep() -> Settings:
    """Get application settings."""
    return get_settings()

def get_db_dep() -> Generator[InMemorySession, None, None]:
    """Get database session."""
    db = get_db()
    try:
        yield db
    finally:
        db.commit()

def get_notification_service_dep() -> NotificationService:
    """Get notification service."""
    return get_notification_service()

def get_search_service_dep() -> SearchService:
    """Get search service."""
    return get_search_service()

def get_job_runner_dep() -> JobRunner:
    """Get job runner."""
    return get_job_runner()

def get_git_service_dep() -> GitService:
    """Get Git service."""
    return get_git_service()

def get_user_id() -> str:
    """Get current user ID from request context.
    
    This is a placeholder that should be replaced with actual user authentication.
    For now, it returns a default user ID.
    """
    return "default_user"

def require_user_id(user_id: Optional[str] = None) -> str:
    """Require a valid user ID.
    
    Args:
        user_id: Optional user ID to validate
        
    Returns:
        Validated user ID
        
    Raises:
        HTTPException: If user ID is invalid
    """
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID required"
        )
    return user_id 