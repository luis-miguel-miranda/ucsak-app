import logging

from databricks.sdk import WorkspaceClient
from fastapi import APIRouter, Depends, HTTPException

from ..common.workspace_client import get_workspace_client
from ..controller.catalog_commander_manager import CatalogCommanderManager

# Configure logging
from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["catalog-commander"])

def get_catalog_manager(client: WorkspaceClient = Depends(get_workspace_client)) -> CatalogCommanderManager:
    """Get a configured catalog commander manager instance.
    
    Args:
        client: Databricks workspace client (injected by FastAPI)
        
    Returns:
        Configured catalog commander manager instance
    """
    return CatalogCommanderManager(client)

@router.get('/catalogs')
async def list_catalogs(catalog_manager: CatalogCommanderManager = Depends(get_catalog_manager)):
    """List all catalogs in the Databricks workspace."""
    try:
        logger.info("Starting to fetch catalogs")
        catalogs = catalog_manager.list_catalogs()
        logger.info(f"Successfully fetched {len(catalogs)} catalogs")
        return catalogs
    except Exception as e:
        error_msg = f"Failed to fetch catalogs: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/catalogs/{catalog_name}/schemas')
async def list_schemas(
    catalog_name: str,
    catalog_manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """List all schemas in a catalog."""
    try:
        logger.info(f"Fetching schemas for catalog: {catalog_name}")
        schemas = catalog_manager.list_schemas(catalog_name)
        logger.info(f"Successfully fetched {len(schemas)} schemas for catalog {catalog_name}")
        return schemas
    except Exception as e:
        error_msg = f"Failed to fetch schemas for catalog {catalog_name}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/catalogs/{catalog_name}/schemas/{schema_name}/tables')
async def list_tables(
    catalog_name: str,
    schema_name: str,
    catalog_manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """List all tables in a schema."""
    try:
        logger.info(f"Fetching tables for schema: {catalog_name}.{schema_name}")
        tables = catalog_manager.list_tables(catalog_name, schema_name)
        logger.info(f"Successfully fetched {len(tables)} tables for schema {catalog_name}.{schema_name}")
        return tables
    except Exception as e:
        error_msg = f"Failed to fetch tables for schema {catalog_name}.{schema_name}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/catalogs/dataset/{dataset_path:path}')
async def get_dataset(
    dataset_path: str,
    catalog_manager: CatalogCommanderManager = Depends(get_catalog_manager)
):
    """Get dataset content and schema."""
    try:
        logger.info(f"Fetching dataset: {dataset_path}")
        dataset = catalog_manager.get_dataset(dataset_path)
        logger.info(f"Successfully fetched dataset {dataset_path}")
        return dataset
    except Exception as e:
        error_msg = f"Failed to fetch dataset {dataset_path}: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/catalogs/health')
async def health_check(catalog_manager: CatalogCommanderManager = Depends(get_catalog_manager)):
    """Check if the catalog API is healthy."""
    try:
        logger.info("Performing health check")
        status = catalog_manager.health_check()
        logger.info("Health check successful")
        return status
    except Exception as e:
        error_msg = f"Health check failed: {e!s}"
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=error_msg)

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Catalog commander routes registered")
