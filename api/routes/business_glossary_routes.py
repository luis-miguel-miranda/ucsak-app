from flask import Blueprint, jsonify, request
from controller.business_glossary_manager import BusinessGlossaryManager
from models.business_glossary import Domain, GlossaryTerm
from datetime import datetime
import os
import logging
from pathlib import Path
import uuid

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('business_glossary', __name__)

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
        logger.error(f"Error loading business glossary data: {str(e)}")
else:
    logger.warning(f"Business glossary YAML file not found at {yaml_path}")

@bp.route('/api/business-glossaries', methods=['GET'])
def get_glossaries():
    """Get all glossaries"""
    try:
        logger.info("Retrieving all glossaries")
        glossaries = glossary_manager.list_glossaries()
        return jsonify({'glossaries': glossaries})
    except Exception as e:
        logger.error(f"Error retrieving glossaries: {str(e)}")
        return jsonify({"error": str(e)}), 500

@bp.route('/api/business-glossaries', methods=['POST'])
def create_glossary():
    """Create a new business glossary"""
    try:
        data = request.json
        glossary = glossary_manager.create_glossary(
            name=data['name'],
            description=data['description'],
            scope=data['scope'],
            org_unit=data['org_unit'],
            domain=data['domain'],
            parent_glossary_ids=data.get('parent_glossary_ids', []),
            tags=data.get('tags', [])
        )
        return jsonify(glossary.to_dict()), 201
    except Exception as e:
        logger.error(f"Error creating glossary: {str(e)}")
        return jsonify({"error": str(e)}), 400

@bp.route('/api/business-glossaries/<glossary_id>', methods=['PUT'])
def update_glossary(glossary_id):
    """Update a glossary"""
    try:
        glossary_data = request.get_json()
        updated_glossary = glossary_manager.update_glossary(glossary_id, glossary_data)
        if not updated_glossary:
            return jsonify({"error": "Glossary not found"}), 404
        return jsonify(updated_glossary)
    except Exception as e:
        logger.error(f"Error updating glossary {glossary_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400

@bp.route('/api/business-glossaries/<glossary_id>', methods=['DELETE'])
def delete_glossary(glossary_id):
    """Delete a glossary"""
    try:
        glossary_manager.delete_glossary(glossary_id)
        return '', 204
    except Exception as e:
        logger.error(f"Error deleting glossary {glossary_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400

@bp.route('/api/business-glossaries/<glossary_id>/terms', methods=['GET'])
def get_terms(glossary_id):
    """Get terms for a glossary"""
    try:
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            return jsonify({"error": "Glossary not found"}), 404
        return jsonify([term.to_dict() for term in glossary.terms.values()])
    except Exception as e:
        logger.error(f"Error getting terms for glossary {glossary_id}: {str(e)}")
        return jsonify({"error": str(e)}), 400

@bp.route('/api/business-glossaries/<glossary_id>/terms', methods=['POST'])
def create_term(glossary_id):
    """Create a new term in a glossary"""
    try:
        data = request.json
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            return jsonify({"error": "Glossary not found"}), 404
            
        term = glossary_manager.create_term(**data)
        glossary_manager.add_term_to_glossary(glossary, term)
        return jsonify(term.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@bp.route('/api/business-glossaries/<glossary_id>/terms/<term_id>', methods=['DELETE'])
def delete_term(glossary_id, term_id):
    """Delete a term from a glossary"""
    try:
        glossary = glossary_manager.get_glossary(glossary_id)
        if not glossary:
            return jsonify({"error": "Glossary not found"}), 404
            
        if glossary_manager.delete_term_from_glossary(glossary, term_id):
            return '', 204
        return jsonify({"error": "Term not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Business glossary routes registered")  
