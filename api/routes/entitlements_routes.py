from fastapi import APIRouter, HTTPException
from api.controller.entitlements_manager import EntitlementsManager
from api.models.entitlements import Persona, AccessPrivilege
from datetime import datetime
import os
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

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

@router.get('/api/entitlements/personas')
async def get_personas():
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
        return formatted_personas
    except Exception as e:
        error_msg = f"Error retrieving personas: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.get('/api/entitlements/personas/{persona_id}')
async def get_persona(persona_id: str):
    """Get a specific persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
        
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
        return formatted_persona
    except Exception as e:
        error_msg = f"Error retrieving persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post('/api/entitlements/personas')
async def create_persona(persona_data: dict):
    """Create a new persona"""
    try:
        logger.info(f"Creating new persona: {persona_data.get('name', '')}")
        
        # Create persona
        persona = entitlements_manager.create_persona(
            name=persona_data.get('name', ''),
            description=persona_data.get('description', ''),
            privileges=persona_data.get('privileges', [])
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
        return response
    except Exception as e:
        error_msg = f"Error creating persona: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.put('/api/entitlements/personas/{persona_id}')
async def update_persona(persona_id: str, persona_data: dict):
    """Update a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
        
        logger.info(f"Updating persona with ID: {persona_id}")
        
        # Update persona
        updated_persona = entitlements_manager.update_persona(
            persona_id=persona_id,
            name=persona_data.get('name', None),
            description=persona_data.get('description', None),
            privileges=persona_data.get('privileges', None)
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
        return response
    except Exception as e:
        error_msg = f"Error updating persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete('/api/entitlements/personas/{persona_id}')
async def delete_persona(persona_id: str):
    """Delete a persona"""
    try:
        if not entitlements_manager.get_persona(persona_id):
            logger.warning(f"Persona not found for deletion with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
        
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
        return None
    except Exception as e:
        error_msg = f"Error deleting persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.post('/api/entitlements/personas/{persona_id}/privileges')
async def add_privilege(persona_id: str, privilege_data: dict):
    """Add a privilege to a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
        
        logger.info(f"Adding privilege to persona with ID: {persona_id}")
        
        # Add privilege
        updated_persona = entitlements_manager.add_privilege(
            persona_id=persona_id,
            securable_id=privilege_data.get('securable_id', ''),
            securable_type=privilege_data.get('securable_type', ''),
            permission=privilege_data.get('permission', 'READ')
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
        return response
    except Exception as e:
        error_msg = f"Error adding privilege to persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.delete('/api/entitlements/personas/{persona_id}/privileges/{securable_id:path}')
async def remove_privilege(persona_id: str, securable_id: str):
    """Remove a privilege from a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
        
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
        return response
    except Exception as e:
        error_msg = f"Error removing privilege from persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@router.put('/api/entitlements/personas/{persona_id}/groups')
async def update_persona_groups(persona_id: str, groups_data: dict):
    """Update groups for a persona"""
    try:
        persona = entitlements_manager.get_persona(persona_id)
        if not persona:
            logger.warning(f"Persona not found with ID: {persona_id}")
            raise HTTPException(status_code=404, detail="Persona not found")
            
        if not isinstance(groups_data.get('groups'), list):
            raise HTTPException(status_code=400, detail="Invalid groups data")
            
        updated_persona = entitlements_manager.update_persona_groups(
            persona_id=persona_id,
            groups=groups_data['groups']
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
        return response
    except Exception as e:
        error_msg = f"Error updating groups for persona {persona_id}: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Entitlements routes registered") 