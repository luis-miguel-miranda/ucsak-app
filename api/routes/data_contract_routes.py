from flask import Blueprint, jsonify, request, Response
from controller.data_contract_manager import DataContractManager, Metadata, DataType, SecurityClassification
from datetime import datetime
import os
import logging
from pathlib import Path
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('data_contracts', __name__)

# Create a single instance of the manager
contract_manager = DataContractManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'data_contracts.yaml'
if os.path.exists(yaml_path):
    try:
        # Load data from YAML file
        contract_manager.load_from_yaml(str(yaml_path))
        logger.info(f"Successfully loaded data contracts from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading data contracts from YAML: {str(e)}")


@bp.route('/api/data-contracts', methods=['GET'])
def get_contracts():
    """Get all data contracts"""
    try:
        contracts = contract_manager.list_contracts()
        
        # Format the response to match what the frontend expects
        formatted_contracts = []
        for c in contracts:
            # Use the contract's to_dict() method which now includes all needed fields
            formatted_contracts.append(c.to_dict())
        
        logger.info(f"Retrieved {len(formatted_contracts)} data contracts")
        return jsonify(formatted_contracts)
    except Exception as e:
        error_msg = f"Error retrieving data contracts: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500


@bp.route('/api/data-contracts/<contract_id>', methods=['GET'])
def get_contract(contract_id):
    """Get a specific data contract"""
    try:
        contract = contract_manager.get_contract(contract_id)
        if not contract:
            return jsonify({"error": "Contract not found"}), 404

        # Return full contract including contract_text
        response = contract.to_dict()
        response['contract_text'] = contract.contract_text
        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/api/data-contracts', methods=['POST'])
def create_contract():
    """Create a new data contract"""
    try:
        data = request.json
        contract = contract_manager.create_contract(
            name=data['name'],
            contract_text=data['contract_text'],
            format=data.get('format', 'json'),  # Default to JSON if not specified
            version=data['version'],
            owner=data['owner'],
            description=data.get('description')
        )
        
        # Save to YAML
        yaml_path = Path(__file__).parent.parent / 'data' / 'data_contracts.yaml'
        contract_manager.save_to_yaml(str(yaml_path))
        
        return jsonify(contract.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/api/data-contracts/<contract_id>', methods=['PUT'])
def update_contract(contract_id):
    """Update a data contract"""
    try:
        contract = contract_manager.get_contract(contract_id)
        if not contract:
            logger.warning(f"Data contract not found for update with ID: {contract_id}")
            return jsonify({"error": "Contract not found"}), 404
            
        data = request.json
        logger.info(f"Updating data contract with ID: {contract_id}")
        
        # Update contract
        updated_contract = contract_manager.update_contract(
            contract_id=contract_id,
            name=data.get('name'),
            contract_text=data.get('contract_text'),
            format=data.get('format'),
            version=data.get('version'),
            owner=data.get('owner'),
            description=data.get('description'),
            status=data.get('status')
        )
        
        # Save to YAML
        yaml_path = Path(__file__).parent.parent / 'data' / 'data_contracts.yaml'
        contract_manager.save_to_yaml(str(yaml_path))
        
        return jsonify(updated_contract.to_dict())
    except Exception as e:
        error_msg = f"Error updating data contract {contract_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500


@bp.route('/api/data-contracts/<contract_id>', methods=['DELETE'])
def delete_contract(contract_id):
    """Delete a data contract"""
    try:
        if not contract_manager.get_contract(contract_id):
            logger.warning(f"Data contract not found for deletion with ID: {contract_id}")
            return jsonify({"error": "Contract not found"}), 404
            
        logger.info(f"Deleting data contract with ID: {contract_id}")
        contract_manager.delete_contract(contract_id)
        logger.info(f"Successfully deleted data contract with ID: {contract_id}")
        return '', 204
    except Exception as e:
        error_msg = f"Error deleting data contract {contract_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500


@bp.route('/api/data-contracts/upload', methods=['POST'])
def upload_contract():
    """Upload a contract file"""
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        content_type = file.content_type
        filename = file.filename or ''
        
        # Determine format from content type or extension
        format = 'json'  # default
        if content_type == 'application/x-yaml' or filename.endswith(('.yaml', '.yml')):
            format = 'yaml'
        elif content_type.startswith('text/'):
            format = 'text'
            
        # Read file content
        contract_text = file.read().decode('utf-8')
        
        # Create contract
        contract = contract_manager.create_contract(
            name=filename,
            contract_text=contract_text,
            format=format,
            version='1.0',
            owner='Unknown',
            description=f"Uploaded {format.upper()} contract"
        )
        
        # Save to YAML
        yaml_path = Path(__file__).parent.parent / 'data' / 'data_contracts.yaml'
        contract_manager.save_to_yaml(str(yaml_path))
        
        return jsonify(contract.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.route('/api/data-contracts/<contract_id>/export', methods=['GET'])
def export_contract(contract_id):
    """Export a contract as JSON"""
    try:
        contract = contract_manager.get_contract(contract_id)
        if not contract:
            return jsonify({"error": "Contract not found"}), 404
            
        return Response(
            contract.contract_json,
            mimetype='application/json',
            headers={
                'Content-Disposition': f'attachment; filename="{contract.name.lower().replace(" ", "_")}.json"'
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Data contract routes registered")
