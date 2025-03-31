from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

class DataProductType(str, Enum):
    SOURCE_ALIGNED = "source-aligned"
    AGGREGATE = "aggregate"
    CONSUMER_ALIGNED = "consumer-aligned"
    TABLE = "table"
    VIEW = "view"
    STREAMING_TABLE = "streaming_table"
    MATERIALIZED_VIEW = "materialized_view"
    EXTERNAL_TABLE = "external_table"
    FUNCTION = "function"
    MODEL = "model"
    DASHBOARD = "dashboard"
    JOB = "job"
    NOTEBOOK = "notebook"

class DataProductStatus(str, Enum):
    DRAFT = "draft"
    CANDIDATE = "candidate"
    IN_DEVELOPMENT = "in-development"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"
    RETIRED = "retired"
    DELETED = "deleted"

class SchemaField(BaseModel):
    name: str
    type: str
    description: Optional[str] = None

class DataSource(BaseModel):
    name: str
    type: str
    connection: str

class DataOutput(BaseModel):
    name: str
    type: str
    location: str
    schema: List[SchemaField]

class Port(BaseModel):
    name: str
    description: str
    schema_reference: str  # Reference to Unity Catalog table/view
    port_type: str  # "input" or "output"
    tags: List[str] = Field(default_factory=list)

class DataProduct(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    domain: str
    owner: str
    status: DataProductStatus = DataProductStatus.DRAFT
    type: DataProductType
    tags: List[str] = Field(default_factory=list)
    sources: List[DataSource] = Field(default_factory=list)
    outputs: List[DataOutput] = Field(default_factory=list)
    contracts: List[str] = Field(default_factory=list)
    created: datetime = Field(default_factory=datetime.utcnow)
    updated: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        use_enum_values = True 