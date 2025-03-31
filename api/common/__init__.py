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

from .config import ConfigManager, get_config, get_settings, init_config
from .logging import get_logger
from .workspace_client import get_workspace_client, get_sql_connection, CachedWorkspaceClient
from .database import get_db, InMemorySession
from .notifications import get_notification_service, NotificationService
from .search import get_search_service, SearchService
from .job_runner import get_job_runner, JobRunner
from .git import get_git_service, GitService
from .deps import (
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
    "ConfigManager",
    "get_config",
    "get_settings",
    "init_config",
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
    'get_db_dep',
    'get_notification_service_dep',
    'get_search_service_dep',
    'get_job_runner_dep',
    'get_git_service_dep',
    'get_user_id',
    'require_user_id',
    'LoggingMiddleware',
    'ErrorHandlingMiddleware',
    'CachedWorkspaceClient',
    'get_workspace_client',
    'get_sql_connection'
]
