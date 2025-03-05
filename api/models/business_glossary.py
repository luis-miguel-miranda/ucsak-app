from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from dataclasses import dataclass, field

class TaggedAsset(BaseModel):
    id: str
    name: str
    type: str  # 'table' | 'view' | 'column'
    path: str

@dataclass
class Domain:
    id: str
    name: str
    description: Optional[str] = None

@dataclass
class GlossaryTerm:
    id: str
    name: str
    definition: str
    domain: str
    owner: str
    status: str
    created: datetime
    updated: datetime
    synonyms: List[str] = field(default_factory=list)
    related_terms: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    examples: List[str] = field(default_factory=list)
    source: Optional[str] = None
    taggedAssets: List[Dict[str, Any]] = field(default_factory=list) 