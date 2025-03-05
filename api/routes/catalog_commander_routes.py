import os
from flask import jsonify
import pandas as pd
from databricks import sql
from utils.helper import workspace_client, get_sql_connection

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
            connection = get_sql_connection()
            cursor = connection.cursor()
            
            # Format the dataset path properly for SQL
            path_parts = dataset_path.split('.')
            quoted_path = '.'.join(f'`{part}`' for part in path_parts)
            
            # Get data with Arrow for better performance
            cursor.execute(f"SELECT * FROM {quoted_path} LIMIT 1000")
            df = cursor.fetchall_arrow().to_pandas()
            
            # Get schema from DataFrame
            schema = [
                {
                    'name': col_name,
                    'type': str(df[col_name].dtype),
                    'nullable': df[col_name].hasnans
                }
                for col_name in df.columns
            ]
            
            # Convert DataFrame to records
            rows = df.replace({pd.NA: None}).to_dict('records')
            
            # Convert any non-string values to strings for JSON serialization
            for row in rows:
                for key, value in row.items():
                    if value is not None:
                        row[key] = str(value)
            
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