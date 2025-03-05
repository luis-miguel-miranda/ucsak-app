import os
import logging
from flask import jsonify, request
import pandas as pd
from databricks import sql
from utils.helper import workspace_client, get_sql_connection

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def register_routes(app):
    @app.route('/api/catalogs', methods=['GET'])
    def list_catalogs():
        """List all catalogs in the Databricks workspace."""
        try:
            logger.info("Fetching all catalogs from Databricks workspace")
            catalogs = workspace_client.catalogs.list()
            
            result = [{
                'id': catalog.name,
                'name': catalog.name,
                'type': 'catalog',
                'children': [],  # Empty array means children not fetched yet
                'hasChildren': True  # Catalogs can always have schemas
            } for catalog in catalogs]
            
            logger.info(f"Successfully retrieved {len(result)} catalogs")
            return jsonify(result)
        except Exception as e:
            error_msg = f"Error fetching catalogs: {str(e)}"
            logger.error(error_msg)
            return jsonify({'error': error_msg}), 500

    @app.route('/api/catalogs/<catalog_name>/schemas', methods=['GET'])
    def list_schemas(catalog_name):
        """List all schemas in a catalog."""
        try:
            logger.info(f"Fetching schemas for catalog: {catalog_name}")
            schemas = workspace_client.schemas.list(catalog_name=catalog_name)
            
            result = [{
                'id': f"{catalog_name}.{schema.name}",
                'name': schema.name,
                'type': 'schema',
                'children': [],  # Empty array means children not fetched yet
                'hasChildren': True  # Schemas can always have tables
            } for schema in schemas]
            
            logger.info(f"Successfully retrieved {len(result)} schemas for catalog {catalog_name}")
            return jsonify(result)
        except Exception as e:
            error_msg = f"Error fetching schemas for catalog {catalog_name}: {str(e)}"
            logger.error(error_msg)
            return jsonify({'error': error_msg}), 500

    @app.route('/api/catalogs/<catalog_name>/schemas/<schema_name>/tables', methods=['GET'])
    def list_tables(catalog_name, schema_name):
        """List all tables and views in a schema."""
        try:
            logger.info(f"Fetching tables for schema: {catalog_name}.{schema_name}")
            tables = workspace_client.tables.list(catalog_name=catalog_name, schema_name=schema_name)
            
            result = [{
                'id': f"{catalog_name}.{schema_name}.{table.name}",
                'name': table.name,
                'type': 'view' if hasattr(table, 'table_type') and table.table_type == 'VIEW' else 'table',
                'children': [],  # Empty array for consistency
                'hasChildren': False  # Tables/views are leaf nodes
            } for table in tables]
            
            logger.info(f"Successfully retrieved {len(result)} tables for schema {catalog_name}.{schema_name}")
            return jsonify(result)
        except Exception as e:
            error_msg = f"Error fetching tables for schema {catalog_name}.{schema_name}: {str(e)}"
            logger.error(error_msg)
            return jsonify({'error': error_msg}), 500

    @app.route('/api/catalogs/dataset/<path:dataset_path>', methods=['GET'])
    def get_dataset(dataset_path):
        """Get dataset content and schema from a specific path"""
        connection = None
        try:
            logger.info(f"Fetching dataset content for: {dataset_path}")
            connection = get_sql_connection()
            cursor = connection.cursor()
            
            # Format the dataset path properly for SQL
            path_parts = dataset_path.split('.')
            quoted_path = '.'.join(f'`{part}`' for part in path_parts)
            
            # Get data with Arrow for better performance
            logger.info(f"Executing SQL query: SELECT * FROM {quoted_path} LIMIT 1000")
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
            
            result = {
                'schema': schema,
                'data': rows,
                'total_rows': len(rows)
            }
            
            logger.info(f"Successfully retrieved dataset with {len(rows)} rows and {len(schema)} columns")
            return jsonify(result)
            
        except Exception as e:
            error_msg = f"Error fetching dataset {dataset_path}: {str(e)}"
            logger.error(error_msg)
            return jsonify({'error': error_msg}), 500
        finally:
            if connection:
                try:
                    connection.close()
                    logger.info("Database connection closed")
                except Exception as e:
                    logger.warning(f"Error closing database connection: {str(e)}")

    # Add a health check endpoint
    @app.route('/api/catalogs/health', methods=['GET'])
    def health_check():
        """Check if the catalog API is healthy"""
        try:
            # Try to list catalogs as a health check
            workspace_client.catalogs.list()
            logger.info("Health check successful")
            return jsonify({"status": "healthy"})
        except Exception as e:
            error_msg = f"Health check failed: {str(e)}"
            logger.error(error_msg)
            return jsonify({"status": "unhealthy", "error": error_msg}), 500

    logger.info("Catalog commander routes registered") 