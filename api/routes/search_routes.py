from flask import Blueprint, Flask, jsonify, request
import logging
from controller.search_manager import SearchManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('search', __name__)
search_manager = SearchManager()

@bp.route('/api/search', methods=['GET'])
def search():
    """Search across all data types."""
    query = request.args.get('q', '')
    if not query:
        return jsonify({
            "notifications": [],
            "terms": [],
            "contracts": [],
            "products": []
        })

    try:
        logger.info(f"Searching for: {query}")
        results = search_manager.search(query)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Error during search: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_routes(app: Flask):
    """Register search routes with the Flask app."""
    app.register_blueprint(bp)
    logger.info("Registered search routes") 