from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from enum import Enum

class NotificationType(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

class Notification(BaseModel):
    id: str
    type: NotificationType
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    read: bool = False
    can_delete: bool = True 