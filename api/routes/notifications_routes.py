import os
from pathlib import Path
from typing import List
from flask import Blueprint, Flask, jsonify
import logging
from models.notification import Notification
from controller.notification_manager import NotificationManager, NotificationNotFoundError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('notifications', __name__)
notifications_manager = NotificationManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'notifications.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    try:
        notifications_manager.load_from_yaml()
        logger.info(f"Successfully loaded notifications data from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading notifications data: {str(e)}")
else:
    logger.warning(f"Notifications YAML file not found at {yaml_path}")

@bp.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications"""
    try:
        logger.info("Retrieving all notifications")
        notifications = notifications_manager.get_notifications()
        return jsonify(notifications)
    except Exception as e:
        logger.error(f"Error retrieving notifications: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/notifications', methods=['POST'])
def create_notification(notification: Notification):
    return notifications_manager.create_notification(notification)

@bp.route('/api/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id: str):
    notifications_manager.delete_notification(notification_id)
    return {"status": "success"}

@bp.route('/api/notifications/<notification_id>/read', methods=['PUT'])
def mark_notification_read(notification_id: str):
    try:
        return notifications_manager.mark_notification_read(notification_id)
    except NotificationNotFoundError:
        return jsonify({'error': 'Notification not found'}), 404

# Flask routes for compatibility
@bp.route('/api/notifications', methods=['GET'])
def flask_get_notifications():
    return jsonify(notifications_manager.get_notifications())

def register_routes(app: Flask):
    """Register notification routes with the Flask app."""
    app.register_blueprint(bp)
    logger.info("Registered notifications routes")

