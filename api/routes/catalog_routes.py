from flask import jsonify
from databricks.sdk import WorkspaceClient
import os

workspace_client = WorkspaceClient(
    host=os.getenv('DATABRICKS_HOST'),
    token=os.getenv('DATABRICKS_TOKEN')
)

def register_routes(app):
    @app.route('/api/catalogs', methods=['GET'])
    def list_catalogs():
        """List all catalogs in the Databricks workspace."""
        try:
            catalogs = workspace_client.catalogs.list()
            return jsonify([{
                'id': catalog.name,
                'name': catalog.name,
                'type': 'catalog',
                'children': [],  # Empty array means children not fetched yet
                'hasChildren': True  # Catalogs can always have schemas
            } for catalog in catalogs])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/catalogs/<catalog_name>/schemas', methods=['GET'])
    def list_schemas(catalog_name):
        """List all schemas in a catalog."""
        try:
            schemas = workspace_client.schemas.list(catalog_name=catalog_name)
            return jsonify([{
                'id': f"{catalog_name}.{schema.name}",
                'name': schema.name,
                'type': 'schema',
                'children': [],  # Empty array means children not fetched yet
                'hasChildren': True  # Schemas can always have tables
            } for schema in schemas])
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    @app.route('/api/catalogs/<catalog_name>/schemas/<schema_name>/tables', methods=['GET'])
    def list_tables(catalog_name, schema_name):
        """List all tables and views in a schema."""
        try:
            tables = workspace_client.tables.list(catalog_name=catalog_name, schema_name=schema_name)
            return jsonify([{
                'id': f"{catalog_name}.{schema_name}.{table.name}",
                'name': table.name,
                'type': 'view' if hasattr(table, 'table_type') and table.table_type == 'VIEW' else 'table',
                'children': [],  # Empty array for consistency
                'hasChildren': False  # Tables/views are leaf nodes
            } for table in tables])
        except Exception as e:
            return jsonify({'error': str(e)}), 500 