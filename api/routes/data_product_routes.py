import logging
import os
from pathlib import Path
from typing import List, Dict, Any, Optional

import yaml
from fastapi import APIRouter, HTTPException, UploadFile, File, Body, Depends
from pydantic import ValidationError
import uuid

from api.controller.data_products_manager import DataProductsManager
from api.models.data_products import DataProduct # Use the updated model
from databricks.sdk import WorkspaceClient # Import base client type
from databricks.sdk.errors import PermissionDenied # Import specific error

# Import the dependency function
from api.common.workspace_client import get_workspace_client_dependency

# Configure logging
from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["data-products"])

# --- Manager Dependency --- 
_data_products_manager_instance: Optional[DataProductsManager] = None
async def get_data_products_manager(
    ws_client: WorkspaceClient = Depends(get_workspace_client_dependency(timeout=60))
) -> DataProductsManager:
    """Dependency to get or create the DataProductsManager instance with injected client."""
    global _data_products_manager_instance
    if _data_products_manager_instance is None:
        logger.info("Initializing DataProductsManager instance.")
        manager = DataProductsManager(ws_client=ws_client)
        
        # Load initial data from YAML if it exists
        YAML_PATH = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
        if YAML_PATH.exists():
            logger.info(f"Attempting to load initial data products from {YAML_PATH} into manager.")
            manager.load_from_yaml(str(YAML_PATH))
        else:
            logger.warning(f"Data products YAML file not found at {YAML_PATH}. Manager starts empty.")
            
        _data_products_manager_instance = manager
        
    # Inject ws_client into existing instance if it wasn't present (e.g., during testing setup)
    # Though ideally, the instance is always created with the client via this dependency.
    if not _data_products_manager_instance._ws_client and ws_client:
        logger.warning("Injecting WorkspaceClient into existing DataProductsManager instance.")
        _data_products_manager_instance._ws_client = ws_client
        
    return _data_products_manager_instance

# --- ORDERING CRITICAL: Define ALL static paths before ANY dynamic paths --- 

# --- Specific Helper Endpoints --- 

@router.get('/data-products/statuses', response_model=List[str])
async def get_data_product_statuses(manager: DataProductsManager = Depends(get_data_products_manager)):
    """Get all distinct data product statuses from info and output ports."""
    try:
        statuses = manager.get_distinct_statuses()
        logger.info(f"Retrieved {len(statuses)} distinct data product statuses")
        return statuses
    except Exception as e:
        error_msg = f"Error retrieving data product statuses: {e!s}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/data-products/archetypes', response_model=List[str])
async def get_data_product_archetypes(manager: DataProductsManager = Depends(get_data_products_manager)):
    """Get all distinct data product archetypes."""
    try:
        archetypes = manager.get_distinct_archetypes()
        logger.info(f"Retrieved {len(archetypes)} distinct data product archetypes")
        return archetypes
    except Exception as e:
        error_msg = f"Error retrieving data product archetypes: {e!s}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/data-products/owners', response_model=List[str])
async def get_data_product_owners(manager: DataProductsManager = Depends(get_data_products_manager)):
    """Get all distinct data product owners."""
    try:
        owners = manager.get_distinct_owners()
        logger.info(f"Retrieved {len(owners)} distinct data product owners")
        return owners
    except Exception as e:
        error_msg = f"Error retrieving data product owners: {e!s}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post("/data-products/upload", response_model=List[DataProduct], status_code=201)
async def upload_data_products(file: UploadFile = File(...), manager: DataProductsManager = Depends(get_data_products_manager)):
    """Upload a YAML or JSON file containing a list of data products."""
    if not (file.filename.endswith('.yaml') or file.filename.endswith('.json')):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a YAML or JSON file.")

    try:
        content = await file.read()
        if file.filename.endswith('.yaml'):
            data = yaml.safe_load(content)
        else: # .json
            import json
            data = json.loads(content)
            
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="File must contain a JSON array or YAML list of data product objects.")

        created_products = []
        errors = []
        for product_data in data:
             if not isinstance(product_data, dict):
                 errors.append({"error": "Skipping non-dictionary item.", "item": product_data})
                 continue
             try:
                 product_model = DataProduct(**product_data)
                 product_dict = product_model.model_dump(by_alias=True)

                 if product_model.id and manager.get_product(product_model.id):
                     errors.append({"id": product_model.id, "error": "Product with this ID already exists. Skipping."})
                     continue
                 if not product_model.id:
                    product_dict['id'] = str(uuid.uuid4()) 
                 
                 created_product = manager.create_product(product_dict)
                 created_products.append(created_product)
             except ValidationError as e:
                 errors.append({"id": product_data.get('id', 'N/A'), "error": f"Validation failed: {e}"})
             except Exception as e:
                 errors.append({"id": product_data.get('id', 'N/A'), "error": f"Creation failed: {e!s}"})

        # Attempt to save all changes to YAML after processing the file
        if created_products:
            YAML_PATH = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
            if not manager.save_to_yaml(str(YAML_PATH)):
                logger.warning(f"Could not save updated data products to {YAML_PATH} after batch upload.")

        if errors:
            logger.warning(f"Encountered {len(errors)} errors during file upload processing.")
            # Optionally return errors, or just log them. For now, returning only created ones.
            # Consider raising an exception or returning a mixed response if errors are critical.

        logger.info(f"Successfully created {len(created_products)} data products from uploaded file {file.filename}")
        return created_products # Return list of successfully created products

    except yaml.YAMLError as e:
        raise HTTPException(status_code=400, detail=f"Invalid YAML format: {e}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format: {e}")
    except Exception as e:
        error_msg = f"Error processing uploaded file: {e!s}"
        logger.exception(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# --- Generic List/Create Endpoints --- 

@router.get('/data-products', response_model=Any)
async def get_data_products(manager: DataProductsManager = Depends(get_data_products_manager)):
    """Get all data products."""
    try:
        logger.info("Retrieving all data products via get_data_products route...")
        products = manager.list_products()
        logger.info(f"Retrieved {len(products)} data products")
        return [p.model_dump() for p in products]
    except Exception as e:
        error_msg = f"Error retrieving data products: {e!s}"
        logger.exception(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post('/data-products', response_model=DataProduct, status_code=201)
async def create_data_product(product_data: DataProduct = Body(...), manager: DataProductsManager = Depends(get_data_products_manager)):
    """Create a new data product from a JSON payload conforming to the schema."""
    try:
        logger.info(f"Received request to create data product: {product_data.id if product_data.id else '(new ID will be generated)'}")
        product_dict = product_data.model_dump(by_alias=True)

        if product_data.id and manager.get_product(product_data.id):
             raise HTTPException(status_code=409, detail=f"Data product with ID {product_data.id} already exists.")
        if not product_data.id:
             product_dict['id'] = str(uuid.uuid4())

        created_product = manager.create_product(product_dict)
        
        YAML_PATH = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
        if not manager.save_to_yaml(str(YAML_PATH)):
             logger.warning(f"Could not save updated data products to {YAML_PATH} after creating {created_product.id}")

        logger.info(f"Successfully created data product with ID: {created_product.id}")
        return created_product
    except ValueError as e: 
        logger.error(f"Validation error during product creation: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Unexpected error creating data product: {e!s}"
        logger.exception(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# --- Dynamic ID Endpoints (MUST BE LAST) --- 

@router.get('/data-products/{product_id}', response_model=Any)
async def get_data_product(
    product_id: str,
    manager: DataProductsManager = Depends(get_data_products_manager)
) -> Any: # Return Any to allow returning a dict
    """Gets a single data product by its ID."""
    try:
        product = manager.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Data product not found")
        return product.model_dump(exclude={'created_at', 'updated_at'}, exclude_none=True, exclude_unset=True)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception(f"Unexpected error fetching product {product_id}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put('/data-products/{product_id}', response_model=DataProduct)
async def update_data_product(product_id: str, product_data: DataProduct = Body(...), manager: DataProductsManager = Depends(get_data_products_manager)):
    """Update an existing data product using a JSON payload conforming to the schema."""
    if product_id != product_data.id:
         raise HTTPException(status_code=400, detail="Product ID in path does not match ID in request body.")

    try:
        logger.info(f"Received request to update data product ID: {product_id}")
        
        product_dict = product_data.model_dump(by_alias=True)
        
        updated_product = manager.update_product(product_id, product_dict)
        if not updated_product:
            logger.warning(f"Update failed: Data product not found with ID: {product_id}")
            raise HTTPException(status_code=404, detail="Data product not found")

        YAML_PATH = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
        if not manager.save_to_yaml(str(YAML_PATH)):
            logger.warning(f"Could not save updated data products to {YAML_PATH} after updating {product_id}")

        logger.info(f"Successfully updated data product with ID: {product_id}")
        return updated_product
    except ValueError as e: # Catch validation errors from manager
        logger.error(f"Validation error during product update for ID {product_id}: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException: # Re-raise specific HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Unexpected error updating data product {product_id}: {e!s}"
        logger.exception(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete('/data-products/{product_id}', status_code=204) # No content response
async def delete_data_product(product_id: str, manager: DataProductsManager = Depends(get_data_products_manager)):
    """Delete a data product by ID."""
    try:
        logger.info(f"Received request to delete data product ID: {product_id}")
        deleted = manager.delete_product(product_id)
        if not deleted:
            logger.warning(f"Deletion failed: Data product not found with ID: {product_id}")
            raise HTTPException(status_code=404, detail="Data product not found")

        YAML_PATH = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
        if not manager.save_to_yaml(str(YAML_PATH)):
            logger.warning(f"Could not save updated data products to {YAML_PATH} after deleting {product_id}")

        logger.info(f"Successfully deleted data product with ID: {product_id}")
        return None 
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Unexpected error deleting data product {product_id}: {e!s}"
        logger.exception(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Function to register routes (if used elsewhere)
def register_routes(app):
    """Register routes with the FastAPI app."""
    app.include_router(router)
    logger.info("Data product routes registered")
