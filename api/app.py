import os
from flask import Flask
from dotenv import load_dotenv
from routes import data_contract_routes, data_product_routes, business_glossary_routes, catalog_commander_routes, entitlements_routes, settings_routes, notifications_routes, search_routes
from flask_cors import CORS

load_dotenv()

# Ensure environment variable is set correctly
assert os.getenv(
    'DATABRICKS_WAREHOUSE_ID'), "DATABRICKS_WAREHOUSE_ID must be set in app.yaml."

app = Flask(__name__, 
    static_folder='../build',  # Path to your React build folder
    static_url_path=''         # Empty string to serve from root
)
CORS(app)

# Register routes from each module
data_product_routes.register_routes(app)
data_contract_routes.register_routes(app)
business_glossary_routes.register_routes(app)
entitlements_routes.register_routes(app)
catalog_commander_routes.register_routes(app)
settings_routes.register_routes(app)
notifications_routes.register_routes(app)
search_routes.register_routes(app)


@app.route('/api/time')
def get_current_time():
    return {'time': time.time()}


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def index(path):
    """
    This is the catch-all route for the root URL. It will return the index.html file from the build folder.
    """
    return app.send_static_file('index.html')


@app.errorhandler(404)
def not_found(e):
    """
    This is a catch-all route for 404 errors. It will return the index.html file from the build folder.
    """
    return app.send_static_file('index.html')


if __name__ == '__main__':
    app.run(debug=True)
