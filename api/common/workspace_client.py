import os
import time
import logging
from functools import wraps
from typing import Dict, Any, Callable
from fastapi import Depends
from databricks.sdk import WorkspaceClient
from databricks.sdk.core import Config
from databricks import sql

from .config import get_settings, Settings

# Configure logging
logger = logging.getLogger(__name__)

class CachedWorkspaceClient(WorkspaceClient):
    def __init__(self, client: WorkspaceClient):
        self._client = client
        self._cache: Dict[str, Any] = {}
        self._cache_times: Dict[str, float] = {}
        self._cache_duration = 60  # 1 minute in seconds

    def _cache_result(self, key: str) -> Callable:
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            def wrapper(*args, **kwargs):
                current_time = time.time()
                # Check if we have a cached result that's still valid
                if (
                    key in self._cache 
                    and key in self._cache_times 
                    and current_time - self._cache_times[key] < self._cache_duration
                ):
                    logger.info(f"Cache hit for {key} (age: {current_time - self._cache_times[key]:.1f}s)")
                    return self._cache[key]

                # Call the actual function and cache the result
                logger.info(f"Cache miss for {key}, calling Databricks workspace")
                result = func(*args, **kwargs)
                logger.info(result)
                self._cache[key] = result
                self._cache_times[key] = current_time
                return result
            return wrapper
        return decorator

    @property
    def clusters(self):
        class CachedClusters:
            def __init__(self, parent):
                self._parent = parent

            def list(self):
                return self._parent._cache_result('clusters.list')(
                    lambda: list(self._parent._client.clusters.list())
                )()

        return CachedClusters(self)

    # Delegate all other attributes to the original client
    def __getattr__(self, name):
        return getattr(self._client, name)

def get_workspace_client(settings: Settings = Depends(get_settings)) -> WorkspaceClient:
    """Get a configured Databricks workspace client with caching.
    
    Args:
        settings: Application settings (injected by FastAPI)
        
    Returns:
        Cached workspace client instance
    """
    # Log environment values with obfuscated token
    masked_token = f"{settings.DATABRICKS_TOKEN[:4]}...{settings.DATABRICKS_TOKEN[-4:]}" if settings.DATABRICKS_TOKEN else None
    logger.info(f"Initializing workspace client with host: {settings.DATABRICKS_HOST}, token: {masked_token}")
    
    client = WorkspaceClient(
        host=settings.DATABRICKS_HOST,
        token=settings.DATABRICKS_TOKEN
    )
    return CachedWorkspaceClient(client)

def get_sql_connection(settings: Settings = Depends(get_settings)):
    """Create and return a Databricks SQL connection.
    
    Args:
        settings: Application settings (injected by FastAPI)
        
    Returns:
        SQL connection instance
    """
    if settings.ENV == 'LOCAL':
        return sql.connect(
            server_hostname=settings.DATABRICKS_HOST,
            http_path=f"/sql/1.0/warehouses/{settings.DATABRICKS_WAREHOUSE_ID}",
            access_token=settings.DATABRICKS_TOKEN
        )
    else:
        return sql.connect(
            server_hostname=settings.DATABRICKS_HOST,
            http_path=f"/sql/1.0/warehouses/{settings.DATABRICKS_WAREHOUSE_ID}",
            credentials_provider=lambda: settings.authenticate
        ) 