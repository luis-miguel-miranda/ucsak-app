import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.controller.notifications_manager import NotificationNotFoundError, NotificationsManager
from api.models.notifications import Notification

# Configure logging
from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["notifications"])
notifications_manager = NotificationsManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'notifications.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    try:
        notifications_manager.load_from_yaml()
        logger.info(f"Successfully loaded notifications data from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading notifications data: {e!s}")
else:
    logger.warning(f"Notifications YAML file not found at {yaml_path}")

@router.get('/notifications')
async def get_notifications():
    """Get all notifications"""
    try:
        logger.info("Retrieving all notifications")
        notifications = notifications_manager.get_notifications()
        return notifications
    except Exception as e:
        logger.error(f"Error retrieving notifications: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/notifications')
async def create_notification(notification: Notification):
    """Create a new notification"""
    try:
        return notifications_manager.create_notification(notification)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete('/notifications/{notification_id}')
async def delete_notification(notification_id: str):
    """Delete a notification"""
    try:
        notifications_manager.delete_notification(notification_id)
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put('/notifications/{notification_id}/read')
async def mark_notification_read(notification_id: str):
    """Mark a notification as read"""
    try:
        return notifications_manager.mark_notification_read(notification_id)
    except NotificationNotFoundError:
        raise HTTPException(status_code=404, detail="Notification not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def register_routes(app):
    """Register notification routes with the FastAPI app."""
    app.include_router(router)
    logger.info("Notifications routes registered")

