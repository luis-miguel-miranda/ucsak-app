import logging

from databricks.sdk import WorkspaceClient
from fastapi import APIRouter, Depends, HTTPException

from ..common.workspace_client import get_workspace_client
from ..controller.settings_manager import SettingsManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

def get_settings_manager(client: WorkspaceClient = Depends(get_workspace_client)) -> SettingsManager:
    """Get a configured settings manager instance.
    
    Args:
        client: Databricks workspace client (injected by FastAPI)
        
    Returns:
        Configured settings manager instance
    """
    return SettingsManager(client)

@router.get('/settings')
async def get_settings(manager: SettingsManager = Depends(get_settings_manager)):
    """Get all settings including available job clusters"""
    try:
        settings = manager.get_settings()
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/settings')
async def update_settings(
    settings: dict,
    manager: SettingsManager = Depends(get_settings_manager)
):
    """Update settings"""
    try:
        updated = manager.update_settings(settings)
        return updated.to_dict()
    except Exception as e:
        logger.error(f"Error updating settings: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/settings/health')
async def health_check(manager: SettingsManager = Depends(get_settings_manager)):
    """Check if the settings API is healthy"""
    try:
        # Try to list workflows as a health check
        manager.list_available_workflows()
        logger.info("Workflows health check successful")
        return {"status": "healthy"}
    except Exception as e:
        error_msg = f"Workflows health check failed: {e!s}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/settings/job-clusters')
async def list_job_clusters(manager: SettingsManager = Depends(get_settings_manager)):
    """List all available job clusters"""
    try:
        clusters = manager.get_job_clusters()
        return [{
            'id': cluster.id,
            'name': cluster.name,
            'node_type_id': cluster.node_type_id,
            'autoscale': cluster.autoscale,
            'min_workers': cluster.min_workers,
            'max_workers': cluster.max_workers
        } for cluster in clusters]
    except Exception as e:
        logger.error(f"Error fetching job clusters: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Settings routes registered")
