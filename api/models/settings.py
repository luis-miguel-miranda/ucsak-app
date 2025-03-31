from datetime import datetime

from pydantic import BaseModel


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
