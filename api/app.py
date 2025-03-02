from flask import Flask
from dotenv import load_dotenv
from routes import catalog_routes, data_contract_routes, data_product_routes, workflow_routes
from flask_cors import CORS

load_dotenv()

def create_app():
    app = Flask(__name__, static_folder='../build', static_url_path='/')
    CORS(app)
    
    # Register routes from each module
    catalog_routes.register_routes(app)
    data_contract_routes.register_routes(app)
    data_product_routes.register_routes(app)
    workflow_routes.register_routes(app)

    @app.route('/api/time')
    def get_current_time():
        return {'time': time.time()}

    @app.route('/')
    def index():
        return app.send_static_file('index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True) 