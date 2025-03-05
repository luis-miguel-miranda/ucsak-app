from flask import Blueprint, jsonify, request
from controller.data_contract_manager import DataContractManager, Metadata, DataType, SecurityClassification
from datetime import datetime
import os
from pathlib import Path

bp = Blueprint('data_contracts', __name__)

# Create a single instance of the manager
contract_manager = DataContractManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'data_contracts.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    contract_manager.load_from_yaml(yaml_path)
else:
    # Initialize with example data
    contract_manager.initialize_example_data()


@bp.route('/api/data-contracts', methods=['GET'])
def get_contracts():
    """Get all data contracts"""
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

    return jsonify(formatted_contracts)


@bp.route('/api/data-contracts/<contract_id>', methods=['GET'])
def get_contract(contract_id):
    """Get a specific data contract"""
    contract = contract_manager.get_contract(contract_id)
    if not contract:
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

    return jsonify(formatted_contract)


@bp.route('/api/data-contracts', methods=['POST'])
def create_contract():
    """Create a new data contract"""
    data = request.json

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
    return jsonify({
        'id': contract.id,
        'name': contract.name,
        'description': metadata.business_description or '',
        'version': contract.version,
        'status': contract.status.value,
        'owner': metadata.owner,
        'format': 'JSON',  # Add format field
        'created': contract.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        'updated': contract.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    }), 201


def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
