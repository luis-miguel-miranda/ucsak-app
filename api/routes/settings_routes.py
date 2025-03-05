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
def list_settings():
    """List all available and installed settings."""
    try:
        logger.info("Fetching available and installed workflows")
        available = settings_manager.list_available_workflows()
        installed = settings_manager.list_installed_workflows()
        
        result = {
            'available_workflows': available,
            'installed_workflows': [
                {
                    'id': w.id,
                    'name': w.name,
                    'installed_at': w.installed_at.isoformat(),
                    'updated_at': w.updated_at.isoformat(),
                    'status': w.status,
                    'workspace_id': w.workspace_id
                } for w in installed
            ]
        }
        
        logger.info(f"Successfully retrieved {len(available)} available workflows and {len(installed)} installed workflows")
        return jsonify(result)
    except Exception as e:
        error_msg = f"Error fetching workflows: {str(e)}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

@bp.route('/api/settings/<setting_name>', methods=['POST'])
def install_setting(setting_name):
    """Install a new setting."""
    try:
        logger.info(f"Installing workflow: {workflow_name}")
        installation = settings_manager.install_workflow(workflow_name)
        
        result = {
            'id': installation.id,
            'name': installation.name,
            'installed_at': installation.installed_at.isoformat(),
            'status': installation.status,
            'workspace_id': installation.workspace_id
        }
        
        logger.info(f"Successfully installed workflow: {workflow_name}")
        return jsonify(result), 201
    except ValueError as e:
        error_msg = f"Workflow not found: {workflow_name} - {str(e)}"
        logger.warning(error_msg)
        return jsonify({'error': error_msg}), 404
    except Exception as e:
        error_msg = f"Error installing workflow {workflow_name}: {str(e)}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

@bp.route('/api/settings/<setting_name>', methods=['PUT'])
def update_setting(setting_name):
    """Update an existing setting."""
    try:
        logger.info(f"Updating workflow: {setting_name}")
        installation = settings_manager.update_workflow(setting_name)
        
        result = {
            'id': installation.id,
            'name': installation.name,
            'updated_at': installation.updated_at.isoformat(),
            'status': installation.status,
            'workspace_id': installation.workspace_id
        }
        
        logger.info(f"Successfully updated workflow: {setting_name}")
        return jsonify(result)
    except ValueError as e:
        error_msg = f"Workflow not found: {setting_name} - {str(e)}"
        logger.warning(error_msg)
        return jsonify({'error': error_msg}), 404
    except Exception as e:
        error_msg = f"Error updating workflow {setting_name}: {str(e)}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

@bp.route('/api/settings/<setting_name>', methods=['DELETE'])
def remove_setting(setting_name):
    """Remove an installed setting."""
    try:
        logger.info(f"Removing workflow: {setting_name}")
        if settings_manager.remove_workflow(setting_name):
            logger.info(f"Successfully removed workflow: {setting_name}")
            return '', 204
        
        logger.warning(f"Workflow not found for removal: {setting_name}")
        return jsonify({'error': 'Workflow not found'}), 404
    except Exception as e:
        error_msg = f"Error removing workflow {setting_name}: {str(e)}"
        logger.error(error_msg)
        return jsonify({'error': error_msg}), 500

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

def register_routes(app):
    """Register routes with the app"""
    app.register_blueprint(bp)
    logger.info("Settings routes registered")