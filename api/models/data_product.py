from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

class DataProductType(str, Enum):
    SOURCE_ALIGNED = "source-aligned"
    AGGREGATE = "aggregate"
    CONSUMER_ALIGNED = "consumer-aligned"

class DataProductStatus(str, Enum):
    CANDIDATE = "candidate"
    IN_DEVELOPMENT = "in-development"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    RETIRED = "retired"

class Port(BaseModel):
    name: str
    description: str
    schema_reference: str  # Reference to Unity Catalog table/view
    port_type: str  # "input" or "output"
    tags: List[str] = []

class DataProduct(BaseModel):
    id: Optional[str] = None
    name: str
    owner: str
    type: DataProductType
    status: DataProductStatus
    description: str
    tags: List[str] = []
    input_ports: List[Port] = []
    output_ports: List[Port] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None 