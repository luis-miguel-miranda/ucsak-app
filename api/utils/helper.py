import os
from databricks.sdk import WorkspaceClient
from databricks.sdk.core import Config
from databricks import sql  # Add this import

def get_workspace_client():
    """Get a configured Databricks workspace client"""
    return WorkspaceClient(
        host=os.getenv('DATABRICKS_HOST'),
        token=os.getenv('DATABRICKS_TOKEN')
    )

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

# Create a singleton instance of the workspace client
workspace_client = get_workspace_client() 