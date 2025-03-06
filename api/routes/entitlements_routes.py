from flask import Blueprint, jsonify, request
from controller.entitlements_manager import EntitlementsManager
from models.entitlements import Persona, AccessPrivilege
from datetime import datetime
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('entitlements', __name__)

# Create a single instance of the manager
entitlements_manager = EntitlementsManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
if os.path.exists(yaml_path):
    try:
        # Load data from YAML file
        success = entitlements_manager.load_from_yaml(str(yaml_path))
        if success:
            logger.info(f"Successfully loaded entitlements data from {yaml_path}")
        else:
            logger.warning(f"Failed to load entitlements data from {yaml_path}, initializing with example data")
            entitlements_manager.initialize_example_data()
    except Exception as e:
        logger.error(f"Error loading entitlements data: {str(e)}")
        logger.info("Initializing with example data instead")
        entitlements_manager.initialize_example_data()
else:
    try:
        # Initialize with example data
        entitlements_manager.initialize_example_data()
        logger.info("Initialized example entitlements data")
        
        # Save example data to YAML for future use
        try:
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved example entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save example data to YAML: {str(e)}")
    except Exception as e:
        logger.error(f"Error initializing example entitlements data: {str(e)}")

@bp.route('/api/entitlements/personas', methods=['GET'])
def get_personas():
    """Get all personas"""
    try:
        personas = entitlements_manager.list_personas()
        
        # Format the response
        formatted_personas = []
        for p in personas:
            formatted_personas.append({
                'id': p.id,
                'name': p.name,
                'description': p.description,
                'groups': p.groups,
                'created_at': p.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'updated_at': p.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'privileges': [
                    {
                        'securable_id': priv.securable_id,
                        'securable_type': priv.securable_type,
                        'permission': priv.permission
                    } for priv in p.privileges
                ]
            })
        
        logger.info(f"Retrieved {len(formatted_personas)} personas")
        return jsonify(formatted_personas)
    except Exception as e:
        error_msg = f"Error retrieving personas: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>', methods=['GET'])
def get_persona(persona_id):
    """Get a specific persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
        
        # Format the response
        formatted_persona = {
            'id': persona.id,
            'name': persona.name,
            'description': persona.description,
            'created_at': persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in persona.privileges
            ]
        }
        
        logger.info(f"Retrieved persona with ID: {persona_id}")
        return jsonify(formatted_persona)
    except Exception as e:
        error_msg = f"Error retrieving persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas', methods=['POST'])
def create_persona():
    """Create a new persona"""
    try:
        data = request.json
        logger.info(f"Creating new persona: {data.get('name', '')}")
        
        # Create persona
        persona = entitlements_manager.create_persona(
            name=data.get('name', ''),
            description=data.get('description', ''),
            privileges=data.get('privileges', [])
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': persona.id,
            'name': persona.name,
            'description': persona.description,
            'created_at': persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in persona.privileges
            ]
        }
        
        logger.info(f"Successfully created persona with ID: {persona.id}")
        return jsonify(response), 201
    except Exception as e:
        error_msg = f"Error creating persona: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>', methods=['PUT'])
def update_persona(persona_id):
    """Update a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
        
        data = request.json
        logger.info(f"Updating persona with ID: {persona_id}")
        
        # Update persona
        updated_persona = entitlements_manager.update_persona(
            persona_id=persona_id,
            name=data.get('name', None),
            description=data.get('description', None),
            privileges=data.get('privileges', None)
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': updated_persona.id,
            'name': updated_persona.name,
            'description': updated_persona.description,
            'created_at': updated_persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': updated_persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in updated_persona.privileges
            ]
        }
        
        logger.info(f"Successfully updated persona with ID: {persona_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error updating persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>', methods=['DELETE'])
def delete_persona(persona_id):
    """Delete a persona"""
    try:
        if not entitlements_manager.get_persona(persona_id):
            logger.warning(f"Persona not found for deletion with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
        
        logger.info(f"Deleting persona with ID: {persona_id}")
        entitlements_manager.delete_persona(persona_id)
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        logger.info(f"Successfully deleted persona with ID: {persona_id}")
        return '', 204
    except Exception as e:
        error_msg = f"Error deleting persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>/privileges', methods=['POST'])
def add_privilege(persona_id):
    """Add a privilege to a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
        
        data = request.json
        logger.info(f"Adding privilege to persona with ID: {persona_id}")
        
        # Add privilege
        updated_persona = entitlements_manager.add_privilege(
            persona_id=persona_id,
            securable_id=data.get('securable_id', ''),
            securable_type=data.get('securable_type', ''),
            permission=data.get('permission', 'READ')
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': updated_persona.id,
            'name': updated_persona.name,
            'description': updated_persona.description,
            'created_at': updated_persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': updated_persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in updated_persona.privileges
            ]
        }
        
        logger.info(f"Successfully added privilege to persona with ID: {persona_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error adding privilege to persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>/privileges/<path:securable_id>', methods=['DELETE'])
def remove_privilege(persona_id, securable_id):
    """Remove a privilege from a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
        
        logger.info(f"Removing privilege {securable_id} from persona with ID: {persona_id}")
        
        # Remove privilege
        updated_persona = entitlements_manager.remove_privilege(
            persona_id=persona_id,
            securable_id=securable_id
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': updated_persona.id,
            'name': updated_persona.name,
            'description': updated_persona.description,
            'created_at': updated_persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': updated_persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in updated_persona.privileges
            ]
        }
        
        logger.info(f"Successfully removed privilege from persona with ID: {persona_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error removing privilege from persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/entitlements/personas/<persona_id>/groups', methods=['PUT'])
def update_persona_groups(persona_id):
    """Update groups for a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            return jsonify({"error": "Persona not found"}), 404
            
        data = request.json
        if not isinstance(data.get('groups'), list):
            return jsonify({"error": "Invalid groups data"}), 400
            
        updated_persona = entitlements_manager.update_persona_groups(
            persona_id=persona_id,
            groups=data['groups']
        )
        
        # Save changes to YAML
        try:
            yaml_path = Path(__file__).parent.parent / 'data' / 'entitlements.yaml'
            entitlements_manager.save_to_yaml(str(yaml_path))
            logger.info(f"Saved updated entitlements data to {yaml_path}")
        except Exception as e:
            logger.warning(f"Could not save updated data to YAML: {str(e)}")
        
        # Format the response
        response = {
            'id': updated_persona.id,
            'name': updated_persona.name,
            'description': updated_persona.description,
            'groups': updated_persona.groups,
            'created_at': updated_persona.created_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated_at': updated_persona.updated_at.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'privileges': [
                {
                    'securable_id': priv.securable_id,
                    'securable_type': priv.securable_type,
                    'permission': priv.permission
                } for priv in updated_persona.privileges
            ]
        }
        
        logger.info(f"Successfully updated groups for persona with ID: {persona_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error updating groups for persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Entitlements routes registered") 