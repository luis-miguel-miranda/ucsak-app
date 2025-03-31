import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import yaml

from api.models.data_product import DataOutput, DataProduct, DataProductStatus, DataProductType, DataSource, SchemaField

logger = logging.getLogger(__name__)

class DataProductManager:
    def __init__(self):
        self._products: Dict[str, DataProduct] = {}

    def get_types(self) -> List[str]:
        """Get all available data product types"""
        return [t.value for t in DataProductType]

    def get_statuses(self) -> List[str]:
        """Get all available data product statuses"""
        return [s.value for s in DataProductStatus]

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

        # Convert string type to enum
        try:
            product_type = DataProductType(type)
        except ValueError:
            raise ValueError(f"Invalid product type: {type}")

        product = DataProduct(
            id=product_id,
            name=name,
            description=description,
            domain=domain,
            owner=owner,
            status=DataProductStatus.DRAFT,
            type=product_type,
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

        # Convert string type to enum if present
        if 'type' in kwargs:
            try:
                kwargs['type'] = DataProductType(kwargs['type'])
            except ValueError:
                raise ValueError(f"Invalid product type: {kwargs['type']}")

        # Convert string status to enum if present
        if 'status' in kwargs:
            try:
                kwargs['status'] = DataProductStatus(kwargs['status'])
            except ValueError:
                raise ValueError(f"Invalid product status: {kwargs['status']}")

        # Update fields
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
            with open(yaml_path) as file:
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

                # Create product with proper type and status enums
                try:
                    product_type = DataProductType(product_data.get('type', ''))
                    product_status = DataProductStatus(product_data.get('status', 'draft'))
                except ValueError as e:
                    logger.error(f"Invalid enum value in YAML: {e}")
                    continue

                product = DataProduct(
                    id=product_data.get('id', str(uuid.uuid4())),
                    name=product_data.get('name', ''),
                    description=product_data.get('description', ''),
                    domain=product_data.get('domain', ''),
                    owner=product_data.get('owner', ''),
                    status=product_status,
                    type=product_type,
                    tags=product_data.get('tags', []),
                    sources=sources,
                    outputs=outputs,
                    contracts=product_data.get('contracts', []),
                    created=created,
                    updated=updated
                )

                self._products[product.id] = product

            return True
        except Exception as e:
            logger.error(f"Error loading data products from YAML: {e}")
            return False
