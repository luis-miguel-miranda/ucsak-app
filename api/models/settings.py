from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class JobCluster(BaseModel):
    id: str
    name: str
    node_type_id: str
    autoscale: bool
    min_workers: int
    max_workers: int

class WorkflowInstallation(BaseModel):
    id: str
    name: str
    installed_at: datetime
    updated_at: datetime
    status: str
    workspace_id: str 