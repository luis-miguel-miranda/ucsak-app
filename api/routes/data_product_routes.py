from fastapi import APIRouter, HTTPException
from api.controller.data_product_manager import DataProductManager, DataSource, DataOutput, SchemaField
from datetime import datetime
import os
import logging
from pathlib import Path
from typing import List, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Create a single instance of the manager
product_manager = DataProductManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
if os.path.exists(yaml_path):
    try:
        # Load data from YAML file
        product_manager.load_from_yaml(str(yaml_path))
        logger.info(f"Successfully loaded data products from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading data products from YAML: {str(e)}")
else:
    try:
        # Initialize with example data
        product_manager.initialize_example_data()
        logger.info("Initialized example data products")
    except Exception as e:
        logger.error(f"Error initializing example data products: {str(e)}")

# Special endpoints first
@router.get('/data-products/statuses')
async def get_data_product_statuses():
    """Get all available data product statuses"""
    try:
        statuses = product_manager.get_statuses()
        logger.info(f"Retrieved {len(statuses)} data product statuses")
        return statuses
    except Exception as e:
        error_msg = f"Error retrieving data product statuses: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/data-products/types')
async def get_data_product_types():
    """Get all available data product types"""
    try:
        types = product_manager.get_types()
        logger.info(f"Retrieved {len(types)} data product types")
        return types
    except Exception as e:
        error_msg = f"Error retrieving data product types: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/data-products/metadata')
async def get_data_product_metadata():
    """Get metadata about data products"""
    try:
        metadata = product_manager.get_metadata()
        logger.info("Retrieved data product metadata")
        return metadata
    except Exception as e:
        error_msg = f"Error retrieving data product metadata: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Generic CRUD endpoints
@router.get('/data-products')
async def get_data_products():
    """Get all data products"""
    try:
        logger.info("Retrieving all data products")
        products = product_manager.list_products()
        
        # Format the response
        formatted_products = []
        for p in products:
            product_dict = {
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'owner': p.owner,
                'type': p.type.value if hasattr(p.type, 'value') else p.type,
                'status': p.status.value if hasattr(p.status, 'value') else p.status
            }
            
            # Add optional fields if they exist
            if hasattr(p, 'created_at'):
                product_dict['created_at'] = p.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            else:
                product_dict['created_at'] = p.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if hasattr(p, 'created') else None
                
            if hasattr(p, 'updated_at'):
                product_dict['updated_at'] = p.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
            else:
                product_dict['updated_at'] = p.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if hasattr(p, 'updated') else None
                
            if hasattr(p, 'version'):
                product_dict['version'] = p.version
                
            # Handle sources with proper error checking
            if hasattr(p, 'sources'):
                try:
                    # Check if sources is a list of objects with to_dict method
                    if all(hasattr(s, 'to_dict') for s in p.sources):
                        product_dict['sources'] = [s.to_dict() for s in p.sources]
                    else:
                        # If sources don't have to_dict, convert them to dicts manually
                        product_dict['sources'] = [
                            {
                                'id': getattr(s, 'id', None),
                                'name': getattr(s, 'name', None),
                                'type': getattr(s, 'type', None),
                                'location': getattr(s, 'location', None)
                            } for s in p.sources
                        ]
                except Exception as e:
                    logger.warning(f"Error processing sources for product {p.id}: {str(e)}")
                    product_dict['sources'] = []
            elif hasattr(p, 'data_sources'):
                product_dict['sources'] = p.data_sources
            else:
                product_dict['sources'] = []
                
            # Handle outputs with proper error checking
            if hasattr(p, 'outputs'):
                try:
                    # Check if outputs is a list of objects with to_dict method
                    if all(hasattr(o, 'to_dict') for o in p.outputs):
                        product_dict['outputs'] = [o.to_dict() for o in p.outputs]
                    else:
                        # If outputs don't have to_dict, convert them to dicts manually
                        product_dict['outputs'] = [
                            {
                                'id': getattr(o, 'id', None),
                                'name': getattr(o, 'name', None),
                                'type': getattr(o, 'type', None),
                                'location': getattr(o, 'location', None)
                            } for o in p.outputs
                        ]
                except Exception as e:
                    logger.warning(f"Error processing outputs for product {p.id}: {str(e)}")
                    product_dict['outputs'] = []
            elif hasattr(p, 'data_outputs'):
                product_dict['outputs'] = p.data_outputs
            else:
                product_dict['outputs'] = []
                
            formatted_products.append(product_dict)
        
        logger.info(f"Retrieved {len(formatted_products)} data products")
        return formatted_products
    except Exception as e:
        error_msg = f"Error retrieving data products: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/data-products/{product_id}')
async def get_data_product(product_id: str):
    """Get a specific data product"""
    try:
        product = product_manager.get_product(product_id)
        if not product:
            logger.warning(f"Data product not found with ID: {product_id}")
            raise HTTPException(status_code=404, detail="Data product not found")
        
        # Format the response
        product_dict = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'owner': product.owner,
            'type': product.type.value if hasattr(product.type, 'value') else product.type,
            'status': product.status.value if hasattr(product.status, 'value') else product.status
        }
        
        # Add optional fields if they exist
        if hasattr(product, 'created_at'):
            product_dict['created_at'] = product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        else:
            product_dict['created_at'] = product.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if hasattr(product, 'created') else None
            
        if hasattr(product, 'updated_at'):
            product_dict['updated_at'] = product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        else:
            product_dict['updated_at'] = product.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ") if hasattr(product, 'updated') else None
            
        if hasattr(product, 'version'):
            product_dict['version'] = product.version
            
        # Handle sources with proper error checking
        if hasattr(product, 'sources'):
            try:
                # Check if sources is a list of objects with to_dict method
                if all(hasattr(s, 'to_dict') for s in product.sources):
                    product_dict['sources'] = [s.to_dict() for s in product.sources]
                else:
                    # If sources don't have to_dict, convert them to dicts manually
                    product_dict['sources'] = [
                        {
                            'id': getattr(s, 'id', None),
                            'name': getattr(s, 'name', None),
                            'type': getattr(s, 'type', None),
                            'location': getattr(s, 'location', None)
                        } for s in product.sources
                    ]
            except Exception as e:
                logger.warning(f"Error processing sources for product {product.id}: {str(e)}")
                product_dict['sources'] = []
        elif hasattr(product, 'data_sources'):
            product_dict['sources'] = product.data_sources
        else:
            product_dict['sources'] = []
            
        # Handle outputs with proper error checking
        if hasattr(product, 'outputs'):
            try:
                # Check if outputs is a list of objects with to_dict method
                if all(hasattr(o, 'to_dict') for o in product.outputs):
                    product_dict['outputs'] = [o.to_dict() for o in product.outputs]
                else:
                    # If outputs don't have to_dict, convert them to dicts manually
                    product_dict['outputs'] = [
                        {
                            'id': getattr(o, 'id', None),
                            'name': getattr(o, 'name', None),
                            'type': getattr(o, 'type', None),
                            'location': getattr(o, 'location', None)
                        } for o in product.outputs
                    ]
            except Exception as e:
                logger.warning(f"Error processing outputs for product {product.id}: {str(e)}")
                product_dict['outputs'] = []
        elif hasattr(product, 'data_outputs'):
            product_dict['outputs'] = product.data_outputs
        else:
            product_dict['outputs'] = []
            
        logger.info(f"Retrieved data product with ID: {product_id}")
        return product_dict
    except Exception as e:
        error_msg = f"Error retrieving data product {product_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post('/data-products')
async def create_data_product(product_data: dict):
    """Create a new data product"""
    try:
        logger.info(f"Creating new data product: {product_data.get('name', '')}")
        
        # Create data product
        product = product_manager.create_product(
            name=product_data.get('name', ''),
            description=product_data.get('description', ''),
            domain=product_data.get('domain', ''),
            owner=product_data.get('owner', ''),
            type=product_data.get('type', ''),
            tags=product_data.get('tags', []),
            sources=product_data.get('sources', []),
            outputs=product_data.get('outputs', []),
            contracts=product_data.get('contracts', [])
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
            product_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated data products to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'owner': product.owner,
            'type': product.type.value if hasattr(product.type, 'value') else product.type,
            'status': product.status.value if hasattr(product.status, 'value') else product.status,
            'created_at': product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        logger.info(f"Successfully created data product with ID: {product.id}")
        return response
    except Exception as e:
        error_msg = f"Error creating data product: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.put('/data-products/{product_id}')
async def update_data_product(product_id: str, product_data: dict):
    """Update a data product"""
    try:
        product = product_manager.get_product(product_id)
        if not product:
            logger.warning(f"Data product not found with ID: {product_id}")
            raise HTTPException(status_code=404, detail="Data product not found")
        
        logger.info(f"Updating data product with ID: {product_id}")
        
        # Update data product
        updated_product = product_manager.update_product(
            product_id=product_id,
            name=product_data.get('name', None),
            description=product_data.get('description', None),
            owner=product_data.get('owner', None),
            type=product_data.get('type', None),
            status=product_data.get('status', None),
            sources=product_data.get('sources', None),
            outputs=product_data.get('outputs', None)
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
            product_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated data products to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': updated_product.id,
            'name': updated_product.name,
            'description': updated_product.description,
            'owner': updated_product.owner,
            'type': updated_product.type.value if hasattr(updated_product.type, 'value') else updated_product.type,
            'status': updated_product.status.value if hasattr(updated_product.status, 'value') else updated_product.status,
            'created_at': updated_product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': updated_product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        logger.info(f"Successfully updated data product with ID: {product_id}")
        return response
    except Exception as e:
        error_msg = f"Error updating data product {product_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete('/data-products/{product_id}')
async def delete_data_product(product_id: str):
    """Delete a data product"""
    try:
        if not product_manager.get_product(product_id):
            logger.warning(f"Data product not found for deletion with ID: {product_id}")
            raise HTTPException(status_code=404, detail="Data product not found")
        
        logger.info(f"Deleting data product with ID: {product_id}")
        product_manager.delete_product(product_id)
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
            product_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated data products to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        logger.info(f"Successfully deleted data product with ID: {product_id}")
        return None
    except Exception as e:
        error_msg = f"Error deleting data product {product_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Data product routes registered") 