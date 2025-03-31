import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import List

import yaml

from api.models.notification import Notification

# Set up logging
logger = logging.getLogger(__name__)

class NotificationNotFoundError(Exception):
    """Raised when a notification is not found."""

class NotificationManager:
    def __init__(self):
        """Initialize the notification manager."""
        self.notifications: List[Notification] = []

    def load_from_yaml(self) -> None:
        """Load example notifications from YAML file."""
        yaml_path = Path(__file__).parent.parent / "data" / "notifications.yaml"
        with open(yaml_path) as file:
            data = yaml.safe_load(file)
            self.notifications = [Notification(**notification) for notification in data['notifications']]
        logger.info(f"Loaded {len(self.notifications)} notifications from {yaml_path}")

    def get_notifications(self) -> List[dict]:
        """Get all notifications."""
        return [{
            'id': n.id,
            'type': n.type,
            'title': n.title,
            'subtitle': n.subtitle,
            'description': n.description,
            'created_at': n.created_at.isoformat() if isinstance(n.created_at, datetime) else n.created_at,
            'read': n.read,
            'can_delete': n.can_delete
        } for n in self.notifications]

    def create_notification(self, notification: Notification) -> Notification:
        """Create a new notification."""
        notification.id = str(uuid.uuid4())
        notification.created_at = datetime.now()
        self.notifications.append(notification)
        return notification

    def delete_notification(self, notification_id: str) -> None:
        """Delete a notification by ID."""
        self.notifications = [n for n in self.notifications if n.id != notification_id]

    def mark_notification_read(self, notification_id: str) -> dict:
        """Mark a notification as read."""
        for notification in self.notifications:
            if notification.id == notification_id:
                notification.read = True
                return {
                    'id': notification.id,
                    'type': notification.type,
                    'title': notification.title,
                    'subtitle': notification.subtitle,
                    'description': notification.description,
                    'created_at': notification.created_at.isoformat() if isinstance(notification.created_at, datetime) else notification.created_at,
                    'read': notification.read,
                    'can_delete': notification.can_delete
                }
        raise NotificationNotFoundError(f"Notification not found: {notification_id}")
