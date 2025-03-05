from flask import Blueprint, jsonify, request
from controller.business_glossary_manager import BusinessGlossaryManager
from models.business_glossary import Domain, GlossaryTerm
from datetime import datetime
import os
from pathlib import Path

bp = Blueprint('business_glossary', __name__)

# Create a single instance of the manager
glossary_manager = BusinessGlossaryManager()

# Check for YAML file in data directory
yaml_path = Path(__file__).parent.parent / 'data' / 'business_glossary.yaml'
if os.path.exists(yaml_path):
    # Load data from YAML file
    glossary_manager.load_from_yaml(str(yaml_path))

@bp.route('/api/business-glossary/terms', methods=['GET'])
def get_terms():
    """Get all glossary terms"""
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
    
    return jsonify(formatted_terms)

@bp.route('/api/business-glossary/domains', methods=['GET'])
def get_domains():
    """Get all domains"""
    domains = glossary_manager.list_domains()
    
    # Format the response
    formatted_domains = []
    for d in domains:
        formatted_domains.append({
            'id': d.id,
            'name': d.name,
            'description': d.description
        })
    
    return jsonify(formatted_domains)

@bp.route('/api/glossary/domains', methods=['GET'])
def get_domains_old():
    """Redirect to the new domains endpoint"""
    return get_domains()

@bp.route('/api/business-glossary/terms/<term_id>', methods=['GET'])
def get_term(term_id):
    """Get a specific glossary term"""
    term = glossary_manager.get_term(term_id)
    if not term:
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
    
    return jsonify(formatted_term)

@bp.route('/api/business-glossary/search', methods=['GET'])
def search_terms():
    """Search for glossary terms"""
    query = request.args.get('q', '')
    if not query:
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
    
    return jsonify(formatted_terms)

@bp.route('/api/business-glossary/terms', methods=['POST'])
def create_term():
    """Create a new glossary term"""
    data = request.json
    
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
        source=data.get('source')
    )
    
    # Format the response
    return jsonify({
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
        'source': term.source
    }), 201

@bp.route('/api/business-glossary/terms/<term_id>', methods=['PUT'])
def update_term(term_id):
    """Update a glossary term"""
    term = glossary_manager.get_term(term_id)
    if not term:
        return jsonify({"error": "Term not found"}), 404
    
    data = request.json
    
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
        source=data.get('source', term.source)
    )
    
    # Format the response
    return jsonify({
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
        'source': updated_term.source
    })

@bp.route('/api/business-glossary/terms/<term_id>', methods=['DELETE'])
def delete_term(term_id):
    """Delete a glossary term"""
    if not glossary_manager.get_term(term_id):
        return jsonify({"error": "Term not found"}), 404
    
    glossary_manager.delete_term(term_id)
    return '', 204

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp) 