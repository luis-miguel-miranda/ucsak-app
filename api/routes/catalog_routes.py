from flask import jsonify
from databricks.sdk import WorkspaceClient
import os
import pandas as pd
from databricks import sql

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

    @app.route('/api/catalogs/dataset/<path:dataset_path>', methods=['GET'])
    def get_dataset(dataset_path):
        """Get dataset content and schema from a specific path"""
        try:
            # Connect to Databricks
            connection = sql.connect(
                server_hostname=os.getenv('DATABRICKS_HOST'),
                http_path=os.getenv('DATABRICKS_HTTP_PATH'),
                access_token=os.getenv('DATABRICKS_TOKEN')
            )
            
            cursor = connection.cursor()
            
            # Format the dataset path properly for SQL
            # Convert path like 'catalog.schema.table' to proper SQL identifier
            path_parts = dataset_path.split('.')
            quoted_path = '.'.join(f'`{part}`' for part in path_parts)
            
            # First get the schema without executing a query
            cursor.execute(f"DESCRIBE TABLE {quoted_path}")
            schema_rows = cursor.fetchall()
            schema = [
                {
                    'name': row[0],  # Column name
                    'type': row[1],  # Data type
                    'nullable': True  # Assuming nullable by default
                }
                for row in schema_rows
            ]
            
            # Now get the data
            cursor.execute(f"SELECT * FROM {quoted_path} LIMIT 1000")
            data = cursor.fetchall()
            
            # Convert to list of dictionaries
            rows = []
            for row in data:
                row_dict = {}
                for i, value in enumerate(row):
                    row_dict[schema[i]['name']] = str(value) if value is not None else None
                rows.append(row_dict)
                
            return jsonify({
                'schema': schema,
                'data': rows,
                'total_rows': len(rows)
            })
            
        except Exception as e:
            print(f"Error fetching dataset: {str(e)}")  # Add logging
            return jsonify({'error': str(e)}), 500
        finally:
            if 'connection' in locals():
                connection.close() 