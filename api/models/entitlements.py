from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid

@dataclass
class AccessPrivilege:
    securable_id: str  # Unity Catalog securable ID (e.g., catalog.schema.table)
    securable_type: str  # 'catalog', 'schema', 'table', 'view'
    permission: str  # 'READ', 'WRITE', 'MANAGE', etc.

@dataclass
class Persona:
    id: str
    name: str
    description: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    privileges: List[AccessPrivilege] = field(default_factory=list) 