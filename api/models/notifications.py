from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


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
