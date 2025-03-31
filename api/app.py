import logging
import time
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from api.common.config import get_settings, init_config
from api.common.middleware import ErrorHandlingMiddleware, LoggingMiddleware
from api.routes import (
    business_glossary_routes,
    catalog_commander_routes,
    compliance_routes,
    data_contract_routes,
    data_product_routes,
    entitlements_routes,
    notifications_routes,
    search_routes,
    settings_routes,
    user_routes,
)

logger = logging.getLogger(__name__)

# Define paths
STATIC_ASSETS_PATH = Path(__file__).parent.parent / "build"
logger.info(f"STATIC_ASSETS_PATH: {STATIC_ASSETS_PATH}")

# Initialize settings before creating the app
init_config()

# Create single FastAPI app with settings dependency
app = FastAPI(
    title="Unity Catalog Swiss Army Knife",
    description="A Databricks App for managing data products, contracts, and more",
    version="1.0.0",
    dependencies=[Depends(get_settings)]
)

# Configure CORS
origins = [
    "http://localhost:8000",
    "http://localhost:5173",
    "http://0.0.0.0:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(LoggingMiddleware)
app.add_middleware(ErrorHandlingMiddleware)

# Mount static files for the React application
app.mount("/static", StaticFiles(directory=STATIC_ASSETS_PATH / "static"), name="static")
app.mount("/assets", StaticFiles(directory=STATIC_ASSETS_PATH), name="assets")

# Register routes from each module
data_product_routes.register_routes(app)
data_contract_routes.register_routes(app)
business_glossary_routes.register_routes(app)
entitlements_routes.register_routes(app)
catalog_commander_routes.register_routes(app)
settings_routes.register_routes(app)
user_routes.register_routes(app)
search_routes.register_routes(app)
notifications_routes.register_routes(app)
compliance_routes.register_routes(app)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the React application's index.html"""
    with open(STATIC_ASSETS_PATH / "index.html") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.exception_handler(404)
async def client_side_routing(_, __):
    """Handle 404 errors by serving the React application's index.html"""
    with open(STATIC_ASSETS_PATH / "index.html") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/api/time")
async def get_current_time():
    """Get the current time (for testing purposes mostly)"""
    return {'time': time.time()}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=True)
