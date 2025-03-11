import os
import time
import logging
from functools import wraps
from typing import Dict, Any, Callable
from databricks.sdk import WorkspaceClient
from databricks.sdk.core import Config
from databricks import sql  # Add this import

# Configure logging
logger = logging.getLogger(__name__)

class CachedWorkspaceClient:
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

def get_workspace_client():
    """Get a configured Databricks workspace client with caching"""
    client = WorkspaceClient(
        host=os.getenv('DATABRICKS_HOST'),
        token=os.getenv('DATABRICKS_TOKEN')
    )
    return CachedWorkspaceClient(client)

def get_config():
    """Get Databricks configuration for authentication"""
    return Config()

def get_sql_connection():
    """Create and return a Databricks SQL connection."""
    cfg = get_config()
    if os.getenv('ENV') == 'LOCAL':
        return sql.connect(
            server_hostname=os.getenv('DATABRICKS_HOST'),
            http_path=os.getenv('DATABRICKS_HTTP_PATH'),
            access_token=os.getenv('DATABRICKS_TOKEN')
        )
    else:
        return sql.connect(
            server_hostname=cfg.host,
            http_path=f"/sql/1.0/warehouses/{os.getenv('DATABRICKS_WAREHOUSE_ID')}",
            credentials_provider=lambda: cfg.authenticate
        ) 

# Create a singleton instance of the cached workspace client
workspace_client = get_workspace_client() 