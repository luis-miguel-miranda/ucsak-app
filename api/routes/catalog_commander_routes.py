import logging
from fastapi import APIRouter, HTTPException, Depends
from databricks.sdk import WorkspaceClient

from ..common.workspace_client import get_workspace_client
from ..controller.catalog_commander_manager import CatalogCommanderManager
from ..models.catalog_commander import CatalogItem, CatalogOperation

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

def get_catalog_manager(client: WorkspaceClient = Depends(get_workspace_client)) -> CatalogCommanderManager:
    """Get a configured catalog commander manager instance.
    
    Args:
        client: Databricks workspace client (injected by FastAPI)
        
    Returns:
        Configured catalog commander manager instance
    """
    return CatalogCommanderManager(client)

@router.get('/api/catalogs')
async def list_catalogs(manager: CatalogCommanderManager = Depends(get_catalog_manager)):
    """List all catalogs in the Databricks workspace."""
    try:
        return manager.list_catalogs()
    except Exception as e:
        error_msg = f"Error fetching catalogs: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/catalogs/{catalog_name}/schemas')
async def list_schemas(
    catalog_name: str,
    manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """List all schemas in a catalog."""
    try:
        return manager.list_schemas(catalog_name)
    except Exception as e:
        error_msg = f"Error fetching schemas for catalog {catalog_name}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/catalogs/{catalog_name}/schemas/{schema_name}/tables')
async def list_tables(
    catalog_name: str,
    schema_name: str,
    manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """List all tables and views in a schema."""
    try:
        return manager.list_tables(catalog_name, schema_name)
    except Exception as e:
        error_msg = f"Error fetching tables for schema {catalog_name}.{schema_name}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/catalogs/dataset/{dataset_path:path}')
async def get_dataset(
    dataset_path: str,
    manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """Get dataset content and schema from a specific path"""
    try:
        return manager.get_dataset(dataset_path)
    except Exception as e:
        error_msg = f"Error fetching dataset {dataset_path}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/catalogs/health')
async def health_check(manager: CatalogCommanderManager = Depends(get_catalog_manager)):
    """Check if the catalog API is healthy"""
    try:
        return manager.health_check()
    except Exception as e:
        error_msg = f"Health check failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Catalog commander routes registered") 
