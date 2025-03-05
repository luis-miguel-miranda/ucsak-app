from flask import Blueprint, jsonify, request
from controller.data_product_manager import DataProductManager, DataSource, DataOutput, SchemaField
from datetime import datetime
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('data_products', __name__)

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

@bp.route('/api/data-products', methods=['GET'])
def get_data_products():
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
                'status': p.status
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
            else:
                product_dict['outputs'] = []
                
            formatted_products.append(product_dict)
        
        logger.info(f"Retrieved {len(formatted_products)} data products")
        return jsonify(formatted_products)
    except Exception as e:
        error_msg = f"Error retrieving data products: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/<product_id>', methods=['GET'])
def get_data_product(product_id):
    """Get a specific data product"""
    try:
        product = product_manager.get_product(product_id)
        if not product:
            logger.warning(f"Data product not found with ID: {product_id}")
            return jsonify({"error": "Product not found"}), 404
        
        # Format the response
        formatted_product = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'version': product.version,
            'status': product.status,
            'owner': product.owner,
            'domain': product.domain,
            'created': product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'data_sources': product.data_sources,
            'outputs': product.outputs,
            'quality_metrics': product.quality_metrics
        }
        
        logger.info(f"Retrieved data product with ID: {product_id}")
        return jsonify(formatted_product)
    except Exception as e:
        error_msg = f"Error retrieving data product {product_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products', methods=['POST'])
def create_data_product():
    """Create a new data product"""
    try:
        data = request.json
        logger.info(f"Creating new data product: {data.get('name', 'New Product')}")
        
        # Create product
        product = product_manager.create_product(
            name=data.get('name', 'New Product'),
            description=data.get('description', ''),
            version=data.get('version', '1.0'),
            owner=data.get('owner', 'Unknown'),
            domain=data.get('domain', 'default'),
            data_sources=data.get('data_sources', []),
            outputs=data.get('outputs', []),
            quality_metrics=data.get('quality_metrics', [])
        )
        
        # Format the response
        response = {
            'id': product.id,
            'name': product.name,
            'description': product.description,
            'version': product.version,
            'status': product.status,
            'owner': product.owner,
            'domain': product.domain,
            'created': product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'data_sources': product.data_sources,
            'outputs': product.outputs,
            'quality_metrics': product.quality_metrics
        }
        
        logger.info(f"Successfully created data product with ID: {product.id}")
        return jsonify(response), 201
    except Exception as e:
        error_msg = f"Error creating data product: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/<product_id>', methods=['PUT'])
def update_data_product(product_id):
    """Update a data product"""
    try:
        product = product_manager.get_product(product_id)
        if not product:
            logger.warning(f"Data product not found for update with ID: {product_id}")
            return jsonify({"error": "Product not found"}), 404
        
        data = request.json
        logger.info(f"Updating data product with ID: {product_id}")
        
        # Update product
        updated_product = product_manager.update_product(
            product_id=product_id,
            name=data.get('name', product.name),
            description=data.get('description', product.description),
            version=data.get('version', product.version),
            status=data.get('status', product.status),
            owner=data.get('owner', product.owner),
            domain=data.get('domain', product.domain),
            data_sources=data.get('data_sources', product.data_sources),
            outputs=data.get('outputs', product.outputs),
            quality_metrics=data.get('quality_metrics', product.quality_metrics)
        )
        
        # Format the response
        response = {
            'id': updated_product.id,
            'name': updated_product.name,
            'description': updated_product.description,
            'version': updated_product.version,
            'status': updated_product.status,
            'owner': updated_product.owner,
            'domain': updated_product.domain,
            'created': updated_product.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': updated_product.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'data_sources': updated_product.data_sources,
            'outputs': updated_product.outputs,
            'quality_metrics': updated_product.quality_metrics
        }
        
        logger.info(f"Successfully updated data product with ID: {product_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error updating data product {product_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/<product_id>', methods=['DELETE'])
def delete_data_product(product_id):
    """Delete a data product"""
    try:
        if not product_manager.get_product(product_id):
            logger.warning(f"Data product not found for deletion with ID: {product_id}")
            return jsonify({"error": "Product not found"}), 404
        
        logger.info(f"Deleting data product with ID: {product_id}")
        product_manager.delete_product(product_id)
        logger.info(f"Successfully deleted data product with ID: {product_id}")
        return '', 204
    except Exception as e:
        error_msg = f"Error deleting data product {product_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/statuses', methods=['GET'])
def get_data_product_statuses():
    """Get all possible data product statuses"""
    try:
        logger.info("Retrieving data product statuses")
        
        # Define the standard statuses for data products
        statuses = [
            {"id": "draft", "name": "Draft", "description": "Product is in draft state and not yet published"},
            {"id": "published", "name": "Published", "description": "Product is published and available for use"},
            {"id": "deprecated", "name": "Deprecated", "description": "Product is deprecated and will be removed in the future"},
            {"id": "archived", "name": "Archived", "description": "Product is archived and no longer maintained"}
        ]
        
        logger.info(f"Retrieved {len(statuses)} data product statuses")
        return jsonify(statuses)
    except Exception as e:
        error_msg = f"Error retrieving data product statuses: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/metadata', methods=['GET'])
def get_data_product_metadata():
    """Get metadata for data products"""
    try:
        logger.info("Retrieving data product metadata")
        
        # Define metadata for data products
        metadata = {
            "domains": [
                {"id": "finance", "name": "Finance"},
                {"id": "marketing", "name": "Marketing"},
                {"id": "sales", "name": "Sales"},
                {"id": "hr", "name": "Human Resources"},
                {"id": "operations", "name": "Operations"},
                {"id": "it", "name": "Information Technology"},
                {"id": "customer", "name": "Customer Data"}
            ],
            "sourceTypes": [
                {"id": "table", "name": "Database Table"},
                {"id": "file", "name": "File"},
                {"id": "api", "name": "API"},
                {"id": "stream", "name": "Data Stream"}
            ],
            "outputTypes": [
                {"id": "table", "name": "Database Table"},
                {"id": "file", "name": "File"},
                {"id": "api", "name": "API Endpoint"},
                {"id": "dashboard", "name": "Dashboard"}
            ],
            "qualityMetricTypes": [
                {"id": "completeness", "name": "Completeness"},
                {"id": "accuracy", "name": "Accuracy"},
                {"id": "consistency", "name": "Consistency"},
                {"id": "timeliness", "name": "Timeliness"},
                {"id": "validity", "name": "Validity"}
            ]
        }
        
        logger.info("Retrieved data product metadata")
        return jsonify(metadata)
    except Exception as e:
        error_msg = f"Error retrieving data product metadata: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/data-products/types', methods=['GET'])
def get_data_product_types():
    """Get all possible data product types"""
    try:
        logger.info("Retrieving data product types")
        
        # Define the standard types for data products
        types = [
            {"id": "dataset", "name": "Dataset", "description": "A structured collection of data"},
            {"id": "api", "name": "API", "description": "An application programming interface"},
            {"id": "dashboard", "name": "Dashboard", "description": "A visual representation of data"},
            {"id": "model", "name": "Model", "description": "A machine learning or analytical model"},
            {"id": "report", "name": "Report", "description": "A formatted presentation of data"},
            {"id": "pipeline", "name": "Pipeline", "description": "A data processing workflow"}
        ]
        
        logger.info(f"Retrieved {len(types)} data product types")
        return jsonify(types)
    except Exception as e:
        error_msg = f"Error retrieving data product types: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Data product routes registered") 