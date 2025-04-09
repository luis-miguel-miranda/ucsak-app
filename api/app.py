import logging
import mimetypes
import time
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response

from api.common.config import get_settings, init_config
from api.common.middleware import ErrorHandlingMiddleware, LoggingMiddleware
from api.routes import (
    business_glossary_routes,
    catalog_commander_routes,
    compliance_routes,
    data_contract_routes,
    data_product_routes,
    entitlements_routes,
    entitlements_sync_routes,
    estate_manager_routes,
    master_data_management_routes,
    notifications_routes,
    search_routes,
    security_features_routes,
    settings_routes,
    user_routes,
    metadata_routes,
)

from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

# Define paths
STATIC_ASSETS_PATH = Path(__file__).parent.parent / "static"
logger.info(f"STATIC_ASSETS_PATH: {STATIC_ASSETS_PATH}")

# Initialize settings before creating the app
init_config()

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('image/png', '.png')

# Create single FastAPI app with settings dependency
app = FastAPI(
    title="Unity Catalog Swiss Army Knife",
    description="A Databricks App for managing data products, contracts, and more",
    version="1.0.0",
    dependencies=[Depends(get_settings)]
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:8001",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://0.0.0.0:5173",
    "http://0.0.0.0:5174",
    "http://0.0.0.0:5175",
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
app.mount("/static", StaticFiles(directory=STATIC_ASSETS_PATH, html=True), name="static")

# Register routes from each module
data_product_routes.register_routes(app)
data_contract_routes.register_routes(app)
business_glossary_routes.register_routes(app)
entitlements_routes.register_routes(app)
entitlements_sync_routes.register_routes(app)
estate_manager_routes.register_routes(app)
catalog_commander_routes.register_routes(app)
settings_routes.register_routes(app)
user_routes.register_routes(app)
search_routes.register_routes(app)
notifications_routes.register_routes(app)
compliance_routes.register_routes(app)
master_data_management_routes.register_routes(app)
security_features_routes.register_routes(app)
metadata_routes.register_routes(app)

# Define other specific API routes BEFORE the catch-all
@app.get("/api/time")
async def get_current_time():
    """Get the current time (for testing purposes mostly)"""
    return {'time': time.time()}

# Define the SPA catch-all route LAST
@app.get("/{full_path:path}")
def serve_spa(full_path: str):
    # Only catch routes that aren't API routes or static files
    # This check might be redundant now due to ordering, but safe to keep
    if not full_path.startswith("api/") and not full_path.startswith("static/"):
        # Ensure the path exists before serving
        spa_index = STATIC_ASSETS_PATH / "index.html"
        if spa_index.is_file():
           return FileResponse(spa_index, media_type="text/html")
        else:
           # Optional: Return a 404 or a simple HTML message if index.html is missing
           logger.error(f"SPA index.html not found at {spa_index}")
           return HTMLResponse(content="<html><body>Frontend not built or index.html missing.</body></html>", status_code=404)
    # If it starts with api/ or static/ but wasn't handled by a router/StaticFiles,
    # FastAPI will return its default 404 Not Found, which is correct.
    # No explicit return needed here for that case.

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=True)
