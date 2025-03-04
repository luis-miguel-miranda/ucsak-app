from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

class TaggedAsset(BaseModel):
    id: str
    name: str
    type: str  # 'table' | 'view' | 'column'
    path: str

class GlossaryTerm(BaseModel):
    id: str
    name: str
    description: str
    domain: str
    owner: str
    status: str  # 'active' | 'draft' | 'deprecated'
    created: datetime
    updated: datetime
    tagged_assets: List[TaggedAsset] = []

class Domain(BaseModel):
    id: str
    name: str 