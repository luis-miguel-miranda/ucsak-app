import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any

import yaml
from pydantic import ValidationError

# Import Databricks SDK components
from databricks.sdk import WorkspaceClient
from databricks.sdk.errors import NotFound, PermissionDenied

from api.models.data_products import (
    DataOutput,
    DataProduct,
    DataProductStatus,
    DataProductType,
    DataSource,
    SchemaField,
)

from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

class DataProductsManager:
    def __init__(self, ws_client: WorkspaceClient):
        # Store products using the new model, keyed by product ID
        self._products: Dict[str, DataProduct] = {}
        # Store the injected client
        self._ws_client = ws_client
        if not self._ws_client:
             logger.error("WorkspaceClient was not provided to DataProductsManager.")

    def get_types(self) -> List[str]:
        """Get all available data product types"""
        return [t.value for t in DataProductType]

    def get_statuses(self) -> List[str]:
        """Get all available data product statuses"""
        return [s.value for s in DataProductStatus]

    def create_product(self, product_data: Dict[str, Any]) -> DataProduct:
        """Create a new data product from a dictionary conforming to the schema."""
        try:
            # Ensure required fields like id and info are present
            if 'id' not in product_data:
                product_data['id'] = str(uuid.uuid4())
            if 'info' not in product_data:
                raise ValueError("'info' field is required to create a data product")
            
            # Add timestamps
            now = datetime.utcnow()
            product_data['created_at'] = now
            product_data['updated_at'] = now
            
            product = DataProduct(**product_data)
            self._products[product.id] = product
            logger.info(f"Created data product with ID: {product.id}")
            return product
        except ValidationError as e:
            logger.error(f"Validation error creating data product: {e}")
            raise ValueError(f"Invalid data product data: {e}")
        except Exception as e:
            logger.error(f"Error creating data product: {e}")
            raise

    def get_product(self, product_id: str) -> Optional[DataProduct]:
        """Get a data product by ID."""
        return self._products.get(product_id)

    def list_products(self) -> List[DataProduct]:
        """List all data products."""
        return list(self._products.values())

    def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Optional[DataProduct]:
        """Update an existing data product using a dictionary conforming to the schema."""
        product = self._products.get(product_id)
        if not product:
            logger.warning(f"Attempted to update non-existent product: {product_id}")
            return None

        try:
            # Preserve original creation time, update update time
            product_data['created_at'] = product.created_at
            product_data['updated_at'] = datetime.utcnow()
            # Ensure ID remains the same
            product_data['id'] = product_id 
            
            updated_product = DataProduct(**product_data)
            self._products[product_id] = updated_product
            logger.info(f"Updated data product with ID: {product_id}")
            return updated_product
        except ValidationError as e:
            logger.error(f"Validation error updating data product {product_id}: {e}")
            raise ValueError(f"Invalid data product data for update: {e}")
        except Exception as e:
            logger.error(f"Error updating data product {product_id}: {e}")
            raise

    def delete_product(self, product_id: str) -> bool:
        """Delete a data product."""
        if product_id in self._products:
            del self._products[product_id]
            logger.info(f"Deleted data product with ID: {product_id}")
            return True
        logger.warning(f"Attempted to delete non-existent product: {product_id}")
        return False

    def load_from_yaml(self, yaml_path: str) -> bool:
        """Load data products from a YAML file (conforming to the new schema)."""
        try:
            with open(yaml_path) as file:
                data = yaml.safe_load(file)
            
            if not isinstance(data, list):
                 logger.error(f"YAML file {yaml_path} should contain a list of products.")
                 return False

            loaded_count = 0
            validation_errors = 0
            for product_data in data:
                if not isinstance(product_data, dict):
                    logger.warning("Skipping non-dictionary item in YAML data.")
                    continue
                try:
                    # Add default timestamps if missing (useful for initial load)
                    product_data.setdefault('created_at', datetime.utcnow())
                    product_data.setdefault('updated_at', datetime.utcnow())
                    
                    product = DataProduct(**product_data)
                    # Use the ID from the YAML file
                    if product.id in self._products:
                        logger.warning(f"Duplicate product ID found in YAML, overwriting: {product.id}")
                    self._products[product.id] = product
                    loaded_count += 1
                except ValidationError as e:
                    logger.error(f"Validation error loading product from YAML (ID: {product_data.get('id', 'N/A')}): {e}")
                    validation_errors += 1
                except Exception as e:
                     logger.error(f"Error processing product from YAML (ID: {product_data.get('id', 'N/A')}): {e}")
                     validation_errors += 1

            logger.info(f"Loaded {loaded_count} data products from {yaml_path}. Encountered {validation_errors} validation/processing errors.")
            return loaded_count > 0

        except FileNotFoundError:
            logger.warning(f"Data product YAML file not found at {yaml_path}. No products loaded.")
            return False
        except yaml.YAMLError as e:
            logger.error(f"Error parsing data product YAML file {yaml_path}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error loading data products from YAML {yaml_path}: {e}")
            return False

    def save_to_yaml(self, yaml_path: str) -> bool:
        """Save current data products to a YAML file (conforming to the new schema)."""
        try:
            # Convert product objects to dictionaries for YAML serialization
            products_list = [p.dict(by_alias=True) for p in self._products.values()]
            
            with open(yaml_path, 'w') as file:
                yaml.dump(products_list, file, default_flow_style=False, sort_keys=False)
            logger.info(f"Saved {len(products_list)} data products to {yaml_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving data products to YAML {yaml_path}: {e}")
            return False

    # --- Helper methods for distinct values (optional, can be added later if needed) ---
    def get_distinct_owners(self) -> List[str]:
        return sorted(list(set(p.info.owner for p in self._products.values() if p.info and p.info.owner)))

    def get_distinct_domains(self) -> List[str]:
        return sorted(list(set(p.info.domain for p in self._products.values() if p.info and p.info.domain)))

    def get_distinct_archetypes(self) -> List[str]:
         return sorted(list(set(p.info.archetype for p in self._products.values() if p.info and p.info.archetype)))

    def get_distinct_statuses(self) -> List[str]:
        statuses = set()
        for p in self._products.values():
            if p.info and p.info.status:
                statuses.add(p.info.status)
            for op in p.outputPorts:
                if op.status:
                    statuses.add(op.status)
        return sorted(list(statuses))
