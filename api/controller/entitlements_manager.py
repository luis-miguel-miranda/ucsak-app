import uuid
import yaml
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
from models.entitlements import Persona, AccessPrivilege

logger = logging.getLogger(__name__)

class EntitlementsManager:
    def __init__(self):
        self._personas: Dict[str, Persona] = {}
        
    def create_persona(self, 
                      name: str,
                      description: str = None,
                      privileges: List[Dict[str, Any]] = None) -> Persona:
        """Create a new persona"""
        persona_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        # Convert privileges dict to AccessPrivilege objects
        access_privileges = []
        if privileges:
            for priv in privileges:
                access_privileges.append(AccessPrivilege(
                    securable_id=priv.get('securable_id', ''),
                    securable_type=priv.get('securable_type', ''),
                    permission=priv.get('permission', 'READ')
                ))
        
        persona = Persona(
            id=persona_id,
            name=name,
            description=description,
            created_at=now,
            updated_at=now,
            privileges=access_privileges
        )
        
        self._personas[persona_id] = persona
        return persona
    
    def get_persona(self, persona_id: str) -> Optional[Persona]:
        """Get a persona by ID"""
        return self._personas.get(persona_id)
    
    def list_personas(self) -> List[Persona]:
        """List all personas"""
        return list(self._personas.values())
    
    def update_persona(self, persona_id: str, **kwargs) -> Optional[Persona]:
        """Update a persona"""
        persona = self._personas.get(persona_id)
        if not persona:
            return None
            
        for key, value in kwargs.items():
            if key == 'privileges' and value is not None:
                # Convert privileges dict to AccessPrivilege objects
                access_privileges = []
                for priv in value:
                    access_privileges.append(AccessPrivilege(
                        securable_id=priv.get('securable_id', ''),
                        securable_type=priv.get('securable_type', ''),
                        permission=priv.get('permission', 'READ')
                    ))
                persona.privileges = access_privileges
            elif hasattr(persona, key):
                setattr(persona, key, value)
                
        persona.updated_at = datetime.utcnow()
        return persona
    
    def delete_persona(self, persona_id: str) -> bool:
        """Delete a persona"""
        if persona_id in self._personas:
            del self._personas[persona_id]
            return True
        return False
    
    def add_privilege(self, persona_id: str, securable_id: str, securable_type: str, permission: str) -> Optional[Persona]:
        """Add a privilege to a persona"""
        persona = self._personas.get(persona_id)
        if not persona:
            return None
            
        # Check if privilege already exists
        for priv in persona.privileges:
            if priv.securable_id == securable_id:
                priv.permission = permission
                persona.updated_at = datetime.utcnow()
                return persona
                
        # Add new privilege
        persona.privileges.append(AccessPrivilege(
            securable_id=securable_id,
            securable_type=securable_type,
            permission=permission
        ))
        
        persona.updated_at = datetime.utcnow()
        return persona
    
    def remove_privilege(self, persona_id: str, securable_id: str) -> Optional[Persona]:
        """Remove a privilege from a persona"""
        persona = self._personas.get(persona_id)
        if not persona:
            return None
            
        # Filter out the privilege to remove
        persona.privileges = [p for p in persona.privileges if p.securable_id != securable_id]
        persona.updated_at = datetime.utcnow()
        return persona
    
    def load_from_yaml(self, yaml_path: str) -> bool:
        """Load personas from a YAML file"""
        try:
            with open(yaml_path, 'r') as file:
                data = yaml.safe_load(file)
                
            if not data or 'personas' not in data:
                logger.warning(f"No personas found in YAML file: {yaml_path}")
                return False
                
            for persona_data in data.get('personas', []):
                # Parse dates
                created = datetime.fromisoformat(persona_data.get('created_at', '').replace('Z', '+00:00'))
                updated = datetime.fromisoformat(persona_data.get('updated_at', '').replace('Z', '+00:00'))
                
                # Create privileges
                privileges = []
                for priv_data in persona_data.get('privileges', []):
                    privileges.append(AccessPrivilege(
                        securable_id=priv_data.get('securable_id', ''),
                        securable_type=priv_data.get('securable_type', ''),
                        permission=priv_data.get('permission', 'READ')
                    ))
                
                # Create persona
                persona = Persona(
                    id=persona_data.get('id', str(uuid.uuid4())),
                    name=persona_data.get('name', ''),
                    description=persona_data.get('description', ''),
                    created_at=created,
                    updated_at=updated,
                    privileges=privileges
                )
                
                self._personas[persona.id] = persona
                
            logger.info(f"Successfully loaded {len(self._personas)} personas from YAML file")
            return True
        except Exception as e:
            logger.error(f"Error loading personas from YAML: {str(e)}")
            return False
    
    def save_to_yaml(self, yaml_path: str) -> bool:
        """Save personas to a YAML file"""
        try:
            # Convert personas to dict for YAML serialization
            personas_data = []
            for persona in self._personas.values():
                privileges_data = []
                for priv in persona.privileges:
                    privileges_data.append({
                        'securable_id': priv.securable_id,
                        'securable_type': priv.securable_type,
                        'permission': priv.permission
                    })
                
                personas_data.append({
                    'id': persona.id,
                    'name': persona.name,
                    'description': persona.description,
                    'created_at': persona.created_at.isoformat() + 'Z',
                    'updated_at': persona.updated_at.isoformat() + 'Z',
                    'privileges': privileges_data
                })
            
            data = {'personas': personas_data}
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(yaml_path), exist_ok=True)
            
            # Write to YAML file
            with open(yaml_path, 'w') as file:
                yaml.dump(data, file, default_flow_style=False)
                
            logger.info(f"Successfully saved {len(self._personas)} personas to YAML file")
            return True
        except Exception as e:
            logger.error(f"Error saving personas to YAML: {str(e)}")
            return False
    
    def initialize_example_data(self):
        """Initialize with example data"""
        self.create_persona(
            name="Data Analyst",
            description="Standard data analyst with read access to common datasets",
            privileges=[
                {
                    "securable_id": "main.analytics.customer_data",
                    "securable_type": "table",
                    "permission": "READ"
                },
                {
                    "securable_id": "main.analytics.sales_data",
                    "securable_type": "table",
                    "permission": "READ"
                }
            ]
        )
        
        self.create_persona(
            name="Data Engineer",
            description="Data engineer with write access to data pipelines",
            privileges=[
                {
                    "securable_id": "main.raw",
                    "securable_type": "schema",
                    "permission": "WRITE"
                },
                {
                    "securable_id": "main.analytics",
                    "securable_type": "schema",
                    "permission": "WRITE"
                }
            ]
        )
        
        self.create_persona(
            name="Data Steward",
            description="Data governance role with management permissions",
            privileges=[
                {
                    "securable_id": "main",
                    "securable_type": "catalog",
                    "permission": "MANAGE"
                }
            ]
        )
        
        logger.info("Initialized example entitlements data with 3 personas") 