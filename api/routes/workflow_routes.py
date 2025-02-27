from flask import jsonify
from workflow_manager import WorkflowManager
from databricks.sdk import WorkspaceClient
import os

workspace_client = WorkspaceClient(
    host=os.getenv('DATABRICKS_HOST'),
    token=os.getenv('DATABRICKS_TOKEN')
)
workflow_manager = WorkflowManager(workspace_client)

def register_routes(app):
    @app.route('/api/workflows', methods=['GET'])
    def list_workflows():
        """List all available and installed workflows."""
        try:
            available = workflow_manager.list_available_workflows()
            installed = workflow_manager.list_installed_workflows()
            
            return jsonify({
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
            })
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/workflows/<workflow_name>', methods=['POST'])
    def install_workflow(workflow_name):
        """Install a new workflow."""
        try:
            installation = workflow_manager.install_workflow(workflow_name)
            return jsonify({
                'id': installation.id,
                'name': installation.name,
                'installed_at': installation.installed_at.isoformat(),
                'status': installation.status,
                'workspace_id': installation.workspace_id
            }), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/workflows/<workflow_name>', methods=['PUT'])
    def update_workflow(workflow_name):
        """Update an existing workflow."""
        try:
            installation = workflow_manager.update_workflow(workflow_name)
            return jsonify({
                'id': installation.id,
                'name': installation.name,
                'updated_at': installation.updated_at.isoformat(),
                'status': installation.status,
                'workspace_id': installation.workspace_id
            })
        except ValueError as e:
            return jsonify({'error': str(e)}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/workflows/<workflow_name>', methods=['DELETE'])
    def remove_workflow(workflow_name):
        """Remove an installed workflow."""
        try:
            if workflow_manager.remove_workflow(workflow_name):
                return '', 204
            return jsonify({'error': 'Workflow not found'}), 404
        except Exception as e:
            return jsonify({'error': str(e)}), 500