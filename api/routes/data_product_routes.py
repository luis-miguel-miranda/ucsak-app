from datetime import datetime
from typing import List
from flask import Blueprint, jsonify, request
from models.data_product import DataProduct, DataProductType, DataProductStatus
import uuid

bp = Blueprint('data_products', __name__)

# In-memory storage for development - replace with database in production
data_products = {}

@bp.route('/api/data-products', methods=['GET'])
def get_data_products():
    """Get all data products"""
    return jsonify(list(data_products.values()))

@bp.route('/api/data-products/<product_id>', methods=['GET'])
def get_data_product(product_id):
    """Get a specific data product"""
    if product_id not in data_products:
        return jsonify({"error": "Data product not found"}), 404
    return jsonify(data_products[product_id])

@bp.route('/api/data-products', methods=['POST'])
def create_data_product():
    """Create a new data product"""
    try:
        data = request.get_json()
        
        # Generate ID and timestamps
        data['id'] = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat()
        data['created_at'] = current_time
        data['updated_at'] = current_time
        
        # Validate and create data product
        product = DataProduct(**data)
        
        # Store the data product
        data_products[product.id] = product.dict()
        
        return jsonify(product.dict()), 201
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/api/data-products/<product_id>', methods=['PUT'])
def update_data_product(product_id):
    """Update an existing data product"""
    if product_id not in data_products:
        return jsonify({"error": "Data product not found"}), 404
    
    try:
        data = request.get_json()
        data['id'] = product_id
        data['created_at'] = data_products[product_id]['created_at']
        data['updated_at'] = datetime.utcnow().isoformat()
        
        # Validate and update data product
        product = DataProduct(**data)
        
        # Store updated data product
        data_products[product_id] = product.dict()
        
        return jsonify(product.dict())
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/api/data-products/<product_id>', methods=['DELETE'])
def delete_data_product(product_id):
    """Delete a data product"""
    if product_id not in data_products:
        return jsonify({"error": "Data product not found"}), 404
    
    del data_products[product_id]
    return '', 204

@bp.route('/api/data-products/<product_id>/status', methods=['PUT'])
def update_product_status(product_id):
    """Update the status of a data product"""
    if product_id not in data_products:
        return jsonify({"error": "Data product not found"}), 404
    
    try:
        data = request.get_json()
        new_status = DataProductStatus(data['status'])
        
        product_data = data_products[product_id]
        product_data['status'] = new_status
        product_data['updated_at'] = datetime.utcnow().isoformat()
        
        return jsonify(product_data)
    
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/api/data-products/types', methods=['GET'])
def get_product_types():
    """Get available data product types"""
    return jsonify([t.value for t in DataProductType])

@bp.route('/api/data-products/statuses', methods=['GET'])
def get_product_statuses():
    """Get available data product statuses"""
    return jsonify([s.value for s in DataProductStatus])

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp) 