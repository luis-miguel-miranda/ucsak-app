"""
Shared utilities for the Databricks App API.

This package provides common utilities for:
- Configuration management
- Database access
- Logging
- Job management
- Search functionality
- Notifications
- Git integration
- FastAPI middleware and dependencies
"""

from .config import Config, ConfigManager, get_config
from .database import get_db
from .logging import get_logger
from .job_runner import JobRunner, get_job_runner
from .search import SearchService, get_search_service
from .notifications import NotificationService, get_notification_service
from .git import GitService, get_git_service
from .deps import (
    get_settings_dep,
    get_db_dep,
    get_notification_service_dep,
    get_search_service_dep,
    get_job_runner_dep,
    get_git_service_dep,
    get_user_id,
    require_user_id
)
from .middleware import LoggingMiddleware, ErrorHandlingMiddleware

__all__ = [
    "Config",
    "ConfigManager",
    "get_config",
    'get_db',
    'get_logger',
    'JobRunner',
    'get_job_runner',
    'SearchService',
    'get_search_service',
    'NotificationService',
    'get_notification_service',
    'GitService',
    'get_git_service',
    'get_settings_dep',
    'get_db_dep',
    'get_notification_service_dep',
    'get_search_service_dep',
    'get_job_runner_dep',
    'get_git_service_dep',
    'get_user_id',
    'require_user_id',
    'LoggingMiddleware',
    'ErrorHandlingMiddleware'
]
