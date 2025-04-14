from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# Import Pydantic models (API facing)
from api.models.data_products import DataProduct as DataProductApi, DataProductStatus, DataProductType
# Import the manager
from api.controller.data_products_manager import DataProductsManager
# Import the DB session dependency
from api.common.database import get_db
# Import WorkspaceClient if needed for injection
# from databricks.sdk import WorkspaceClient 
# from api.common.databricks_client import get_ws_client # Assuming a dependency like this

router = APIRouter(
    prefix="/data-products",
    tags=["Data Products"],
    responses={404: {"description": "Not found"}},
)

# --- Helper to get manager instance with dependencies ---
# This centralizes manager instantiation for the routes
# Add ws_client dependency if needed: ws_client: WorkspaceClient = Depends(get_ws_client)
def get_data_products_manager(db: Session = Depends(get_db)) -> DataProductsManager:
    # Pass the DB session to the manager
    # Add ws_client=ws_client if the manager requires it
    return DataProductsManager(db=db) 

# --- Routes ---

@router.get("/types", response_model=List[str])
def get_data_product_types(
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Get all available data product types."""
    return manager.get_types()

@router.get("/statuses", response_model=List[str])
def get_data_product_statuses(
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Get all available data product statuses."""
    return manager.get_statuses()

@router.post("/", response_model=DataProductApi, status_code=status.HTTP_201_CREATED)
def create_data_product(
    product: DataProductApi,
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Create a new data product."""
    try:
        # The input 'product' is already validated by Pydantic
        created_product = manager.create_product(product)
        return created_product
    except ValueError as e: # Catch validation/mapping errors from manager
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e: # Catch potential DB errors re-raised by manager
        # Log the error details server-side
        # logger.error(f"Error creating data product: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error creating data product.")

@router.get("/", response_model=List[DataProductApi])
def list_data_products(
    skip: int = 0,
    limit: int = 100,
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Retrieve a list of data products."""
    try:
        products = manager.list_products(skip=skip, limit=limit)
        return products
    except Exception as e:
        # logger.error(f"Error listing data products: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error listing data products.")

@router.get("/{product_id}", response_model=DataProductApi)
def get_data_product(
    product_id: str,
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Get a specific data product by its ID."""
    try:
        product = manager.get_product(product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data product not found")
        return product
    except ValueError as e: # Catch mapping errors
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Internal data error: {e}")
    except Exception as e:
        # logger.error(f"Error getting data product {product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error getting data product.")


@router.put("/{product_id}", response_model=DataProductApi)
def update_data_product(
    product_id: str,
    product: DataProductApi,
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Update an existing data product."""
    try:
        updated_product = manager.update_product(product_id, product)
        if updated_product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data product not found")
        return updated_product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # logger.error(f"Error updating data product {product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error updating data product.")


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_data_product(
    product_id: str,
    manager: DataProductsManager = Depends(get_data_products_manager)
):
    """Delete a data product."""
    try:
        deleted = manager.delete_product(product_id)
        if not deleted:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Data product not found")
        # No content response on success
        return
    except Exception as e:
        # logger.error(f"Error deleting data product {product_id}: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error deleting data product.") 