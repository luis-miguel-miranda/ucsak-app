from flask import Flask
from dotenv import load_dotenv
from routes import catalog_routes, data_contract_routes, workflow_routes

load_dotenv()

def create_app():
    app = Flask(__name__)
    
    # Register routes from each module
    catalog_routes.register_routes(app)
    data_contract_routes.register_routes(app)
    workflow_routes.register_routes(app)
    
    @app.route('/api/time')
    def get_current_time():
        return {'time': time.time()}

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True) 