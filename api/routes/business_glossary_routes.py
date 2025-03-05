from flask import Blueprint, jsonify, request
from controller.business_glossary_manager import BusinessGlossaryManager
from models.business_glossary import Domain, GlossaryTerm
from datetime import datetime
import os
import logging
from pathlib import Path

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
        if success:
            logger.info(f"Successfully loaded business glossary data from {yaml_path}")
        else:
            logger.error(f"Failed to load business glossary data from {yaml_path}")
    except Exception as e:
        logger.error(f"Error loading business glossary data: {str(e)}")
else:
    logger.warning(f"Business glossary YAML file not found at {yaml_path}")

@bp.route('/api/business-glossary/terms', methods=['GET'])
def get_terms():
    """Get all glossary terms"""
    try:
        terms = glossary_manager.list_terms()
        
        # Format the response
        formatted_terms = []
        for t in terms:
            formatted_terms.append({
                'id': t.id,
                'name': t.name,
                'definition': t.definition,
                'domain': t.domain,
                'owner': t.owner,
                'status': t.status,
                'created': t.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'updated': t.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'synonyms': t.synonyms,
                'related_terms': t.related_terms,
                'tags': t.tags,
                'examples': t.examples,
                'source': t.source,
                'taggedAssets': t.taggedAssets
            })
        
        logger.info(f"Retrieved {len(formatted_terms)} glossary terms")
        return jsonify(formatted_terms)
    except Exception as e:
        error_msg = f"Error retrieving glossary terms: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/domains', methods=['GET'])
def get_domains():
    """Get all domains"""
    try:
        domains = glossary_manager.list_domains()
        
        # Format the response
        formatted_domains = []
        for d in domains:
            formatted_domains.append({
                'id': d.id,
                'name': d.name,
                'description': d.description
            })
        
        logger.info(f"Retrieved {len(formatted_domains)} domains")
        return jsonify(formatted_domains)
    except Exception as e:
        error_msg = f"Error retrieving domains: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/terms/<term_id>', methods=['GET'])
def get_term(term_id):
    """Get a specific glossary term"""
    try:
        term = glossary_manager.get_term(term_id)
        if not term:
            logger.warning(f"Term not found with ID: {term_id}")
            return jsonify({"error": "Term not found"}), 404
        
        # Format the response
        formatted_term = {
            'id': term.id,
            'name': term.name,
            'definition': term.definition,
            'domain': term.domain,
            'owner': term.owner,
            'status': term.status,
            'created': term.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': term.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'synonyms': term.synonyms,
            'related_terms': term.related_terms,
            'tags': term.tags,
            'examples': term.examples,
            'source': term.source,
            'taggedAssets': term.taggedAssets
        }
        
        logger.info(f"Retrieved term with ID: {term_id}")
        return jsonify(formatted_term)
    except Exception as e:
        error_msg = f"Error retrieving term {term_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/search', methods=['GET'])
def search_terms():
    """Search for glossary terms"""
    try:
        query = request.args.get('q', '')
        if not query:
            logger.info("Empty search query, returning empty results")
            return jsonify([])
        
        terms = glossary_manager.search_terms(query)
        
        # Format the response
        formatted_terms = []
        for t in terms:
            formatted_terms.append({
                'id': t.id,
                'name': t.name,
                'definition': t.definition,
                'domain': t.domain,
                'owner': t.owner,
                'status': t.status,
                'created': t.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'updated': t.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
                'synonyms': t.synonyms,
                'related_terms': t.related_terms,
                'tags': t.tags,
                'examples': t.examples,
                'source': t.source,
                'taggedAssets': t.taggedAssets
            })
        
        logger.info(f"Search for '{query}' returned {len(formatted_terms)} results")
        return jsonify(formatted_terms)
    except Exception as e:
        error_msg = f"Error searching terms with query '{query}': {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/terms', methods=['POST'])
def create_term():
    """Create a new glossary term"""
    try:
        data = request.json
        logger.info(f"Creating new term: {data.get('name', '')}")
        
        # Create term
        term = glossary_manager.create_term(
            name=data.get('name', ''),
            definition=data.get('definition', ''),
            domain=data.get('domain', ''),
            owner=data.get('owner', ''),
            synonyms=data.get('synonyms', []),
            related_terms=data.get('related_terms', []),
            tags=data.get('tags', []),
            examples=data.get('examples', []),
            source=data.get('source'),
            taggedAssets=data.get('taggedAssets', [])
        )
        
        # Format the response
        response = {
            'id': term.id,
            'name': term.name,
            'definition': term.definition,
            'domain': term.domain,
            'owner': term.owner,
            'status': term.status,
            'created': term.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': term.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'synonyms': term.synonyms,
            'related_terms': term.related_terms,
            'tags': term.tags,
            'examples': term.examples,
            'source': term.source,
            'taggedAssets': term.taggedAssets
        }
        
        logger.info(f"Successfully created term with ID: {term.id}")
        return jsonify(response), 201
    except Exception as e:
        error_msg = f"Error creating term: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/terms/<term_id>', methods=['PUT'])
def update_term(term_id):
    """Update a glossary term"""
    try:
        term = glossary_manager.get_term(term_id)
        if not term:
            logger.warning(f"Term not found for update with ID: {term_id}")
            return jsonify({"error": "Term not found"}), 404
        
        data = request.json
        logger.info(f"Updating term with ID: {term_id}")
        
        # Update term
        updated_term = glossary_manager.update_term(
            term_id,
            name=data.get('name', term.name),
            definition=data.get('definition', term.definition),
            domain=data.get('domain', term.domain),
            owner=data.get('owner', term.owner),
            synonyms=data.get('synonyms', term.synonyms),
            related_terms=data.get('related_terms', term.related_terms),
            tags=data.get('tags', term.tags),
            examples=data.get('examples', term.examples),
            source=data.get('source', term.source),
            taggedAssets=data.get('taggedAssets', term.taggedAssets)
        )
        
        # Format the response
        response = {
            'id': updated_term.id,
            'name': updated_term.name,
            'definition': updated_term.definition,
            'domain': updated_term.domain,
            'owner': updated_term.owner,
            'status': updated_term.status,
            'created': updated_term.created.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'updated': updated_term.updated.strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
            'synonyms': updated_term.synonyms,
            'related_terms': updated_term.related_terms,
            'tags': updated_term.tags,
            'examples': updated_term.examples,
            'source': updated_term.source,
            'taggedAssets': updated_term.taggedAssets
        }
        
        logger.info(f"Successfully updated term with ID: {term_id}")
        return jsonify(response)
    except Exception as e:
        error_msg = f"Error updating term {term_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

@bp.route('/api/business-glossary/terms/<term_id>', methods=['DELETE'])
def delete_term(term_id):
    """Delete a glossary term"""
    try:
        if not glossary_manager.get_term(term_id):
            logger.warning(f"Term not found for deletion with ID: {term_id}")
            return jsonify({"error": "Term not found"}), 404
        
        logger.info(f"Deleting term with ID: {term_id}")
        glossary_manager.delete_term(term_id)
        logger.info(f"Successfully deleted term with ID: {term_id}")
        return '', 204
    except Exception as e:
        error_msg = f"Error deleting term {term_id}: {str(e)}"
        logger.error(error_msg)
        return jsonify({"error": error_msg}), 500

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Business glossary routes registered") 