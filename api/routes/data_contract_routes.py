from flask import Blueprint, jsonify, request
from data_contracts import DataContractManager, ContractStatus, ColumnDefinition, DatasetSchema, Dataset
from datetime import datetime

bp = Blueprint('data_contracts', __name__)

contract_manager = DataContractManager()

# In-memory storage for development
data_contracts = {
    "contract1": {
        "id": "contract1",
        "name": "Customer Data Contract",
        "description": "Data contract for customer master data",
        "version": "1.0",
        "status": "active",
        "owner": "Data Governance Team",
        "created": "2024-01-01T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "schema": {
            "fields": [
                {
                    "name": "customer_id",
                    "type": "string",
                    "required": True,
                    "description": "Unique identifier for customer"
                },
                {
                    "name": "full_name",
                    "type": "string",
                    "required": True,
                    "description": "Customer's full name"
                },
                {
                    "name": "email",
                    "type": "string",
                    "required": True,
                    "description": "Primary email address"
                }
            ]
        },
        "dataProducts": ["product1", "product2"]
    },
    "contract2": {
        "id": "contract2",
        "name": "Product Catalog Contract",
        "description": "Data contract for product information",
        "version": "1.0",
        "status": "active",
        "owner": "Product Team",
        "created": "2024-01-02T00:00:00Z",
        "updated": "2024-01-15T00:00:00Z",
        "schema": {
            "fields": [
                {
                    "name": "product_id",
                    "type": "string",
                    "required": True,
                    "description": "Unique product identifier"
                },
                {
                    "name": "name",
                    "type": "string",
                    "required": True,
                    "description": "Product name"
                },
                {
                    "name": "price",
                    "type": "decimal",
                    "required": True,
                    "description": "Current price"
                }
            ]
        },
        "dataProducts": ["product1"]
    }
}

@bp.route('/api/data-contracts', methods=['GET'])
def get_contracts():
    """Get all data contracts"""
    return jsonify(list(data_contracts.values()))

@bp.route('/api/data-contracts/<contract_id>', methods=['GET'])
def get_contract(contract_id):
    """Get a specific data contract"""
    if contract_id not in data_contracts:
        return jsonify({"error": "Contract not found"}), 404
    return jsonify(data_contracts[contract_id])

@bp.route('/api/data-contracts', methods=['POST'])
def create_contract():
    """Create a new data contract"""
    data = request.json
    contract_id = f"contract{len(data_contracts) + 1}"
    now = datetime.utcnow().isoformat() + 'Z'
    
    new_contract = {
        "id": contract_id,
        "name": data['name'],
        "description": data['description'],
        "version": "1.0",
        "status": "draft",
        "owner": data['owner'],
        "created": now,
        "updated": now,
        "schema": data['schema'],
        "dataProducts": data.get('dataProducts', [])
    }
    
    data_contracts[contract_id] = new_contract
    return jsonify(new_contract), 201

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)

    @app.route('/api/contracts', methods=['POST'])
    def create_contract():
        data = request.json
        try:
            contract = contract_manager.create_contract(
                name=data['name'],
                description=data['description'],
                schema_version=data['schema_version'],
                data_format=data['data_format'],
                schema_definition=data['schema_definition'],
                validation_rules=data['validation_rules']
            )
            return jsonify({
                'id': contract.id,
                'name': contract.name,
                'status': contract.status.value,
                'created_at': contract.created_at.isoformat()
            }), 201
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400

    @app.route('/api/contracts', methods=['GET'])
    def list_contracts():
        contracts = contract_manager.list_contracts()
        return jsonify([{
            'id': c.id,
            'name': c.name,
            'status': c.status.value,
            'created_at': c.created_at.isoformat(),
            'updated_at': c.updated_at.isoformat()
        } for c in contracts])

    @app.route('/api/contracts/<contract_id>', methods=['GET'])
    def get_contract(contract_id):
        contract = contract_manager.get_contract(contract_id)
        if not contract:
            return jsonify({'error': 'Contract not found'}), 404
        
        return jsonify({
            'id': contract.id,
            'name': contract.name,
            'description': contract.description,
            'schema_version': contract.schema_version,
            'data_format': contract.data_format,
            'schema_definition': contract.schema_definition,
            'status': contract.status.value,
            'created_at': contract.created_at.isoformat(),
            'updated_at': contract.updated_at.isoformat(),
            'validation_rules': contract.validation_rules
        })

    @app.route('/api/contracts/<contract_id>', methods=['PUT'])
    def update_contract(contract_id):
        data = request.json
        status = ContractStatus(data['status']) if 'status' in data else None
        
        contract = contract_manager.update_contract(
            contract_id=contract_id,
            name=data.get('name'),
            description=data.get('description'),
            schema_version=data.get('schema_version'),
            data_format=data.get('data_format'),
            schema_definition=data.get('schema_definition'),
            status=status,
            validation_rules=data.get('validation_rules')
        )
        
        if not contract:
            return jsonify({'error': 'Contract not found'}), 404
        
        return jsonify({
            'id': contract.id,
            'name': contract.name,
            'status': contract.status.value,
            'updated_at': contract.updated_at.isoformat()
        })

    @app.route('/api/contracts/<contract_id>', methods=['DELETE'])
    def delete_contract(contract_id):
        if contract_manager.delete_contract(contract_id):
            return '', 204
        return jsonify({'error': 'Contract not found'}), 404

    @app.route('/api/contracts/<contract_id>/datasets', methods=['POST'])
    def add_dataset(contract_id):
        data = request.json
        try:
            columns = [
                ColumnDefinition(
                    name=col['name'],
                    data_type=DataType[col['data_type'].upper()],
                    comment=col.get('comment'),
                    nullable=col.get('nullable', True)
                )
                for col in data['schema']['columns']
            ]
            
            schema = DatasetSchema(
                columns=columns,
                primary_key=data['schema'].get('primary_key'),
                partition_columns=data['schema'].get('partition_columns')
            )
            
            dataset = Dataset(
                name=data['name'],
                type=data['type'],
                schema=schema,
                description=data.get('description'),
                location=data.get('location'),
                view_definition=data.get('view_definition')
            )
            
            contract = contract_manager.add_dataset_to_contract(contract_id, dataset)
            if not contract:
                return jsonify({'error': 'Contract not found'}), 404
                
            return jsonify({
                'message': 'Dataset added successfully',
                'dataset_name': dataset.name
            }), 201
            
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @app.route('/api/contracts/<contract_id>/datasets/<dataset_name>', methods=['PUT'])
    def update_dataset(contract_id, dataset_name):
        data = request.json
        try:
            columns = [
                ColumnDefinition(
                    name=col['name'],
                    data_type=DataType[col['data_type'].upper()],
                    comment=col.get('comment'),
                    nullable=col.get('nullable', True)
                )
                for col in data['schema']['columns']
            ]
            
            schema = DatasetSchema(
                columns=columns,
                primary_key=data['schema'].get('primary_key'),
                partition_columns=data['schema'].get('partition_columns')
            )
            
            dataset = Dataset(
                name=data['name'],
                type=data['type'],
                schema=schema,
                description=data.get('description'),
                location=data.get('location'),
                view_definition=data.get('view_definition')
            )
            
            contract = contract_manager.update_dataset_in_contract(contract_id, dataset_name, dataset)
            if not contract:
                return jsonify({'error': 'Contract or dataset not found'}), 404
                
            return jsonify({
                'message': 'Dataset updated successfully',
                'dataset_name': dataset.name
            })
            
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

    @app.route('/api/contracts/<contract_id>/datasets/<dataset_name>', methods=['DELETE'])
    def remove_dataset(contract_id, dataset_name):
        contract = contract_manager.remove_dataset_from_contract(contract_id, dataset_name)
        if not contract:
            return jsonify({'error': 'Contract or dataset not found'}), 404
            
        return jsonify({
            'message': 'Dataset removed successfully'
        })
