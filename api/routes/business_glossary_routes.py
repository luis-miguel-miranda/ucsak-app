import logging
import os
from pathlib import Path

from fastapi import APIRouter, HTTPException

from api.controller.business_glossary_manager import BusinessGlossaryManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api")

# Create a single instance of the manager
glossary_manager = BusinessGlossaryManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'business_glossary.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    try:
        success = glossary_manager.load_from_yaml(str(yaml_path))
        logger.info(f"Successfully loaded business glossary data from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading business glossary data: {e!s}")
else:
    logger.warning(f"Business glossary YAML file not found at {yaml_path}")

@router.get('/business-glossaries')
async def get_glossaries():
    """Get all glossaries"""
    try:
        logger.info("Retrieving all glossaries")
        glossaries = glossary_manager.list_glossaries()
        return {'glossaries': glossaries}
    except Exception as e:
        logger.error(f"Error retrieving glossaries: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post('/business-glossaries')
async def create_glossary(glossary_data: dict):
    """Create a new business glossary"""
    try:
        glossary = glossary_manager.create_glossary(
            name=glossary_data['name'],
            description=glossary_data['description'],
            scope=glossary_data['scope'],
            org_unit=glossary_data['org_unit'],
            domain=glossary_data['domain'],
            parent_glossary_ids=glossary_data.get('parent_glossary_ids', []),
            tags=glossary_data.get('tags', [])
        )
        return glossary.to_dict()
    except Exception as e:
        logger.error(f"Error creating glossary: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))

@router.put('/business-glossaries/{glossary_id}')
async def update_glossary(glossary_id: str, glossary_data: dict):
    """Update a glossary"""
    try:
        updated_glossary = glossary_manager.update_glossary(glossary_id, glossary_data)
        if not updated_glossary:
            raise HTTPException(status_code=404, detail="Glossary not found")
        return updated_glossary
    except Exception as e:
        logger.error(f"Error updating glossary {glossary_id}: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))

@router.delete('/business-glossaries/{glossary_id}')
async def delete_glossary(glossary_id: str):
    """Delete a glossary"""
    try:
        glossary_manager.delete_glossary(glossary_id)
        return None
    except Exception as e:
        logger.error(f"Error deleting glossary {glossary_id}: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/business-glossaries/{glossary_id}/terms')
async def get_terms(glossary_id: str):
    """Get terms for a glossary"""
    try:
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            raise HTTPException(status_code=404, detail="Glossary not found")
        return [term.to_dict() for term in glossary.terms.values()]
    except Exception as e:
        logger.error(f"Error getting terms for glossary {glossary_id}: {e!s}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post('/business-glossaries/{glossary_id}/terms')
async def create_term(glossary_id: str, term_data: dict):
    """Create a new term in a glossary"""
    try:
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            raise HTTPException(status_code=404, detail="Glossary not found")

        term = glossary_manager.create_term(**term_data)
        glossary_manager.add_term_to_glossary(glossary, term)
        return term.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete('/business-glossaries/{glossary_id}/terms/{term_id}')
async def delete_term(glossary_id: str, term_id: str):
    """Delete a term from a glossary"""
    try:
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            raise HTTPException(status_code=404, detail="Glossary not found")

        if glossary_manager.delete_term_from_glossary(glossary, term_id):
            return None
        raise HTTPException(status_code=404, detail="Term not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get('/business-glossaries/counts')
async def get_glossary_counts():
    """Get counts of glossaries and terms"""
    try:
        counts = glossary_manager.get_counts()
        return counts
    except Exception as e:
        logger.error(f"Error getting glossary counts: {e!s}")
        raise HTTPException(status_code=500, detail=str(e))

def register_routes(app):
    """Register routes with the app"""
    app.include_router(router)
    logger.info("Business glossary routes registered")
