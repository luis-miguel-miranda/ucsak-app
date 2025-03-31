import json
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

import yaml


@dataclass
class DataContract:
    id: str
    name: str
    contract_text: str  # Raw contract text (JSON, YAML, etc)
    version: str
    owner: str
    format: str  # Format of the contract (json, yaml, etc)
    description: Optional[str] = None
    status: str = "draft"
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self):
        """Convert to dict for API responses"""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description or f"Data contract for {self.name}",
            'version': self.version,
            'status': self.status,
            'owner': self.owner,
            'format': self.format,
            'created': self.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            'updated': self.updated_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        }

    def get_contract_data(self) -> dict:
        """Get the contract as a Python dict"""
        if self.format.lower() == 'json':
            return json.loads(self.contract_text)
        elif self.format.lower() in ('yaml', 'yml'):
            return yaml.safe_load(self.contract_text)
        else:
            return {'content': self.contract_text}  # Return raw text for other formats

    @staticmethod
    def validate_contract_text(text: str, format: str) -> bool:
        """Validate if string is valid format"""
        try:
            if format.lower() == 'json':
                json.loads(text)
            elif format.lower() in ('yaml', 'yml'):
                yaml.safe_load(text)
            return True
        except (json.JSONDecodeError, yaml.YAMLError):
            return False
