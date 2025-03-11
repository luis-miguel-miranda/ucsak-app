from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class JobCluster:
    id: str
    name: str
    node_type_id: str
    autoscale: bool
    min_workers: int
    max_workers: int

@dataclass
class Settings:
    job_cluster_id: Optional[str] = None
    sync_enabled: bool = False
    sync_repository: Optional[str] = None
    enabled_jobs: List[str] = None
    updated_at: datetime = None

    def to_dict(self):
        return {
            'job_cluster_id': self.job_cluster_id,
            'sync_enabled': self.sync_enabled,
            'sync_repository': self.sync_repository,
            'enabled_jobs': self.enabled_jobs or [],
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        } 