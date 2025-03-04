from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

class DatasetSchema:
    name: str
    type: str
    nullable: bool
    description: Optional[str]

class DatasetDefinition(BaseModel):
    name: str
    type: str  # "table" or "view"
    schema: List[DatasetSchema]
    example_data: List[Dict[str, Any]]
    entitlements: Dict[str, Any] = {
        "column_masks": {},  # column_name -> mask_function
        "row_filters": []    # list of filter expressions
    }

class DataContract(BaseModel):
    id: Optional[str]
    name: str
    version: str
    status: str
    owner: str
    description: str
    datasets: List[DatasetDefinition]
    created_at: Optional[datetime]
    updated_at: Optional[datetime] 