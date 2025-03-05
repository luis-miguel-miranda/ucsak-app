from flask import Blueprint, jsonify, request
from controller.data_contract_manager import DataContractManager, Metadata, DataType, SecurityClassification
from datetime import datetime
import os
import logging
from pathlib import Path

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
else:
    try:
        # Initialize with example data
        contract_manager.initialize_example_data()
        logger.info("Initialized example data contracts")
    except Exception as e:
        logger.error(f"Error initializing example data contracts: {str(e)}")


@bp.route('/api/data-contracts', methods=['GET'])
def get_contracts():
    """Get all data contracts"""
    try:
        contracts = contract_manager.list_contracts()
        
        # Format the response to match what the frontend expects
        formatted_contracts = []
        for c in contracts:
            formatted_contracts.append({
                'id': c.id,
                'name': c.name,
                'description': c.metadata.business_description or f"Data contract for {c.name}",
                'version': c.version,
                'status': c.status.value,
                'owner': c.metadata.owner,
                'created': c.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'updated': c.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'format': 'JSON',  # Add format field
                'dataProducts': []  # Add any related data products here
            })
        
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
            logger.warning(f"Data contract not found with ID: {contract_id}")
            return jsonify({"error": "Contract not found"}), 404
        
        # Format the response to match what the frontend expects
        formatted_contract = {
            'id': contract.id,
            'name': contract.name,
            'description': contract.metadata.business_description or f"Data contract for {contract.name}",
            'version': contract.version,
            'status': contract.status.value,
            'owner': contract.metadata.owner,
            'created': contract.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': contract.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'format': 'JSON',  # Add format field
            'schema': {
                'fields': []
            },
            'dataProducts': []
        }
        
        # Add fields from all datasets
        for dataset in contract.datasets:
            for column in dataset.schema.columns:
                formatted_contract['schema']['fields'].append({
                    'name': column.name,
                    'type': column.data_type.value,
                    'required': not column.nullable,
                    'description': column.comment or ''
                })
        
        logger.info(f"Retrieved data contract with ID: {contract_id}")
        return jsonify(formatted_contract)
    except Exception as e:
        error_msg = f"Error retrieving data contract {contract_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500


@bp.route('/api/data-contracts', methods=['POST'])
def create_contract():
    """Create a new data contract"""
    try:
        data = request.json
        logger.info(f"Creating new data contract: {data.get('name', 'New Contract')}")
        
        # Create metadata
        metadata = Metadata(
            domain=data.get('domain', 'default'),
            owner=data.get('owner', 'Unknown'),
            business_description=data.get('description', '')
        )
        
        # Create contract (simplified)
        contract = contract_manager.create_contract(
            name=data.get('name', 'New Contract'),
            version=data.get('version', '1.0'),
            metadata=metadata,
            datasets=[],  # Would need to create datasets from schema
            validation_rules=data.get('validationRules', [])
        )
        
        # Return formatted response
        response = {
            'id': contract.id,
            'name': contract.name,
            'description': metadata.business_description or '',
            'version': contract.version,
            'status': contract.status.value,
            'owner': metadata.owner,
            'format': 'JSON',  # Add format field
            'created': contract.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': contract.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        logger.info(f"Successfully created data contract with ID: {contract.id}")
        return jsonify(response), 201
    except Exception as e:
        error_msg = f"Error creating data contract: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500


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
        
        # Update metadata
        metadata = Metadata(
            domain=data.get('domain', contract.metadata.domain),
            owner=data.get('owner', contract.metadata.owner),
            business_description=data.get('description', contract.metadata.business_description)
        )
        
        # Update contract
        updated_contract = contract_manager.update_contract(
            contract_id=contract_id,
            name=data.get('name', contract.name),
            version=data.get('version', contract.version),
            metadata=metadata,
            status=data.get('status', contract.status.value)
        )
        
        # Return formatted response
        response = {
            'id': updated_contract.id,
            'name': updated_contract.name,
            'description': metadata.business_description or '',
            'version': updated_contract.version,
            'status': updated_contract.status.value,
            'owner': metadata.owner,
            'format': 'JSON',
            'created': updated_contract.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': updated_contract.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
        }
        
        logger.info(f"Successfully updated data contract with ID: {contract_id}")
        return jsonify(response)
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


def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Data contract routes registered")
