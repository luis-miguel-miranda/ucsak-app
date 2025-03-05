from flask import Blueprint, jsonify, request
from controller.data_product_manager import DataProductManager, DataSource, DataOutput, SchemaField
from datetime import datetime
import os
from pathlib import Path

bp = Blueprint('data_products', __name__)

# Create a single instance of the manager
product_manager = DataProductManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'data_products.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    product_manager.load_from_yaml(str(yaml_path))

@bp.route('/api/data-products', methods=['GET'])
def get_products():
    """Get all data products"""
    products = product_manager.list_products()
    
    # Format the response to match what the frontend expects
    formatted_products = []
    for p in products:
        formatted_products.append({
            'id': p.id,
            'name': p.name,
            'description': p.description,
            'domain': p.domain,
            'owner': p.owner,
            'status': p.status,
            'created': p.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': p.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'type': p.type,
            'tags': p.tags,
            'contracts': p.contracts
        })
    
    return jsonify(formatted_products)

@bp.route('/api/data-products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get a specific data product"""
    product = product_manager.get_product(product_id)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    
    # Format sources
    sources = []
    for source in product.sources:
        sources.append({
            'name': source.name,
            'type': source.type,
            'connection': source.connection
        })
    
    # Format outputs
    outputs = []
    for output in product.outputs:
        schema = []
        for field in output.schema:
            schema.append({
                'name': field.name,
                'type': field.type,
                'description': field.description
            })
        
        outputs.append({
            'name': output.name,
            'type': output.type,
            'location': output.location,
            'schema': schema
        })
    
    # Format the response
    formatted_product = {
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'domain': product.domain,
        'owner': product.owner,
        'status': product.status,
        'created': product.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'updated': product.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'type': product.type,
        'tags': product.tags,
        'sources': sources,
        'outputs': outputs,
        'contracts': product.contracts
    }
    
    return jsonify(formatted_product)

@bp.route('/api/data-products', methods=['POST'])
def create_product():
    """Create a new data product"""
    data = request.json
    
    # Parse sources
    sources = []
    for source_data in data.get('sources', []):
        sources.append(DataSource(
            name=source_data.get('name', ''),
            type=source_data.get('type', ''),
            connection=source_data.get('connection', '')
        ))
    
    # Parse outputs
    outputs = []
    for output_data in data.get('outputs', []):
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
    
    # Create product
    product = product_manager.create_product(
        name=data.get('name', ''),
        description=data.get('description', ''),
        domain=data.get('domain', ''),
        owner=data.get('owner', ''),
        type=data.get('type', ''),
        tags=data.get('tags', []),
        sources=sources,
        outputs=outputs,
        contracts=data.get('contracts', [])
    )
    
    # Format the response
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'domain': product.domain,
        'owner': product.owner,
        'status': product.status,
        'created': product.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'updated': product.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'type': product.type,
        'tags': product.tags,
        'contracts': product.contracts
    }), 201

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp) 