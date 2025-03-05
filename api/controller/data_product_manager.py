from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Any
import uuid
import yaml
import os
from pathlib import Path

@dataclass
class DataSource:
    name: str
    type: str
    connection: str
    
@dataclass
class SchemaField:
    name: str
    type: str
    description: Optional[str] = None
    
@dataclass
class DataOutput:
    name: str
    type: str
    location: str
    schema: List[SchemaField]
    
@dataclass
class DataProduct:
    id: str
    name: str
    description: str
    domain: str
    owner: str
    status: str
    created: datetime
    updated: datetime
    type: str
    tags: List[str]
    sources: List[DataSource]
    outputs: List[DataOutput]
    contracts: List[str]

class DataProductManager:
    def __init__(self):
        self._products: Dict[str, DataProduct] = {}
        
    def create_product(self, 
                      name: str,
                      description: str,
                      domain: str,
                      owner: str,
                      type: str,
                      tags: List[str],
                      sources: List[DataSource],
                      outputs: List[DataOutput],
                      contracts: List[str]) -> DataProduct:
        """Create a new data product"""
        product_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        product = DataProduct(
            id=product_id,
            name=name,
            description=description,
            domain=domain,
            owner=owner,
            status="active",
            created=now,
            updated=now,
            type=type,
            tags=tags,
            sources=sources,
            outputs=outputs,
            contracts=contracts
        )
        
        self._products[product_id] = product
        return product
    
    def get_product(self, product_id: str) -> Optional[DataProduct]:
        """Get a data product by ID"""
        return self._products.get(product_id)
    
    def list_products(self) -> List[DataProduct]:
        """List all data products"""
        return list(self._products.values())
    
    def update_product(self, product_id: str, **kwargs) -> Optional[DataProduct]:
        """Update a data product"""
        product = self._products.get(product_id)
        if not product:
            return None
            
        for key, value in kwargs.items():
            if hasattr(product, key):
                setattr(product, key, value)
                
        product.updated = datetime.utcnow()
        return product
    
    def delete_product(self, product_id: str) -> bool:
        """Delete a data product"""
        if product_id in self._products:
            del self._products[product_id]
            return True
        return False
    
    def load_from_yaml(self, yaml_path: str) -> bool:
        """Load data products from a YAML file"""
        try:
            with open(yaml_path, 'r') as file:
                data = yaml.safe_load(file)
                
            for product_data in data.get('products', []):
                # Parse sources
                sources = []
                for source_data in product_data.get('sources', []):
                    sources.append(DataSource(
                        name=source_data.get('name', ''),
                        type=source_data.get('type', ''),
                        connection=source_data.get('connection', '')
                    ))
                
                # Parse outputs
                outputs = []
                for output_data in product_data.get('outputs', []):
                    # Parse schema fields
                    schema_fields = []
                    for field_data in output_data.get('schema', []):
                        schema_fields.append(SchemaField(
                            name=field_data.get('name', ''),
                            type=field_data.get('type', ''),
                            description=field_data.get('description', '')
                        ))
                    
                    outputs.append(DataOutput(
                        name=output_data.get('name', ''),
                        type=output_data.get('type', ''),
                        location=output_data.get('location', ''),
                        schema=schema_fields
                    ))
                
                # Parse dates
                created = datetime.fromisoformat(product_data.get('created', '').replace('Z', '+00:00'))
                updated = datetime.fromisoformat(product_data.get('updated', '').replace('Z', '+00:00'))
                
                # Create product
                product = DataProduct(
                    id=product_data.get('id', str(uuid.uuid4())),
                    name=product_data.get('name', ''),
                    description=product_data.get('description', ''),
                    domain=product_data.get('domain', ''),
                    owner=product_data.get('owner', ''),
                    status=product_data.get('status', 'active'),
                    created=created,
                    updated=updated,
                    type=product_data.get('type', ''),
                    tags=product_data.get('tags', []),
                    sources=sources,
                    outputs=outputs,
                    contracts=product_data.get('contracts', [])
                )
                
                self._products[product.id] = product
                
            return True
        except Exception as e:
            print(f"Error loading data products from YAML: {e}")
            return False 