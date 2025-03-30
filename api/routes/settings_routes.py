import os
import logging
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from api.utils.helper import workspace_client
from api.controller.settings_manager import SettingsManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create a single instance of the manager
settings_manager = SettingsManager(workspace_client)

@router.get('/api/settings')
async def get_settings():
    """Get all settings including available job clusters"""
    try:
        settings = settings_manager.get_settings()
        return settings
    except Exception as e:
        logger.error(f"Error getting settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/api/settings')
async def update_settings(settings: dict):
    """Update settings"""
    try:
        updated = settings_manager.update_settings(settings)
        return updated.to_dict()
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/api/settings/health')
async def health_check():
    """Check if the settings API is healthy"""
    try:
        # Try to list workflows as a health check
        settings_manager.list_available_workflows()
        logger.info("Workflows health check successful")
        return {"status": "healthy"}
    except Exception as e:
        error_msg = f"Workflows health check failed: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/settings/job-clusters')
async def list_job_clusters():
    """List all available job clusters"""
    try:
        clusters = settings_manager.get_job_clusters()
        return [{
            'id': cluster.id,
            'name': cluster.name,
            'node_type_id': cluster.node_type_id,
            'autoscale': cluster.autoscale,
            'min_workers': cluster.min_workers,
            'max_workers': cluster.max_workers
        } for cluster in clusters]
    except Exception as e:
        logger.error(f"Error fetching job clusters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Settings routes registered")