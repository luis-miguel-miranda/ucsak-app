import os
import logging
from flask import Blueprint, jsonify, request
from utils.helper import workspace_client
from controller.settings_manager import SettingsManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('settings', __name__)

# Create a single instance of the manager
settings_manager = SettingsManager(workspace_client)

@bp.route('/api/settings', methods=['GET'])
def get_settings():
    """Get all settings including available job clusters"""
    try:
        settings = settings_manager.get_settings()
        return jsonify(settings)
    except Exception as e:
        logger.error(f"Error getting settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/settings', methods=['PUT'])
def update_settings():
    """Update settings"""
    try:
        settings = request.json
        updated = settings_manager.update_settings(settings)
        return jsonify(updated.to_dict())
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        return jsonify({'error': str(e)}), 500

@bp.route('/api/settings/health', methods=['GET'])
def health_check():
    """Check if the settings API is healthy"""
    try:
        # Try to list workflows as a health check
        settings_manager.list_available_workflows()
        logger.info("Workflows health check successful")
        return jsonify({"status": "healthy"})
    except Exception as e:
        error_msg = f"Workflows health check failed: {str(e)}"
        logger.error(error_msg)
        return jsonify({"status": "unhealthy", "error": error_msg}), 500

@bp.route('/api/settings/job-clusters', methods=['GET'])
def list_job_clusters():
    """List all available job clusters"""
    try:
        clusters = settings_manager.get_job_clusters()
        return jsonify([{
            'id': cluster.id,
            'name': cluster.name,
            'node_type_id': cluster.node_type_id,
            'autoscale': cluster.autoscale,
            'min_workers': cluster.min_workers,
            'max_workers': cluster.max_workers
        } for cluster in clusters])
    except Exception as e:
        logger.error(f"Error fetching job clusters: {str(e)}")
        return jsonify({'error': str(e)}), 500

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Settings routes registered")