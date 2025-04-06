from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class CloudType(str, Enum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"

class SyncStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"

class Estate(BaseModel):
    id: Optional[str] = Field(None, description="Unique identifier for the estate")
    name: str = Field(..., description="Name of the estate")
    description: str = Field(..., description="Description of the estate")
    workspace_url: str = Field(..., description="URL of the Databricks workspace")
    cloud_type: CloudType = Field(..., description="Cloud provider type")
    metastore_name: str = Field(..., description="Name of the metastore")
    is_enabled: bool = Field(True, description="Whether the estate sync is enabled")
    sync_schedule: str = Field("0 0 * * *", description="Cron expression for sync schedule")
    last_sync_time: Optional[datetime] = Field(None, description="Timestamp of last successful sync")
    last_sync_status: Optional[SyncStatus] = Field(None, description="Status of last sync attempt")
    last_sync_error: Optional[str] = Field(None, description="Error message from last failed sync")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp") 