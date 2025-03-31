import os
import time
from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from dotenv import load_dotenv
from api.routes import (
    data_product_routes,
    data_contract_routes,
    business_glossary_routes,
    entitlements_routes,
    catalog_commander_routes,
    settings_routes,
    user_routes,
    search_routes,
    notifications_routes,
)
from fastapi.middleware.cors import CORSMiddleware
from importlib.resources import files
from pathlib import Path
from api.common.config import Config, init_config, get_settings, EndpointConfig
from api.common.middleware import LoggingMiddleware, ErrorHandlingMiddleware
import logging

logger = logging.getLogger(__name__)

# Define paths
STATIC_ASSETS_PATH = Path("api/static")
DOTENV_FILE = Path(__file__).parent.parent / Path(".env")

# Singleton instance for configuration
_config: Config | None = None

def get_config() -> Config:
    """Get the configuration singleton instance"""
    global _config
    if _config is None:
        logger.info("Loading configuration")
        if DOTENV_FILE.exists():
            logger.info(f"Loading configuration from {DOTENV_FILE}")
            load_dotenv(DOTENV_FILE)
        else:
            logger.info(f"Loading configuration from environment variables")
        
        # Initialize settings using Pydantic
        init_config()
        settings = get_settings()
        
        # Create Config from settings
        _config = Config(
            catalog=settings.DATABRICKS_CATALOG,
            schema=settings.DATABRICKS_SCHEMA,
            volume=settings.DATABRICKS_VOLUME,
            endpoint=EndpointConfig(
                host=settings.DATABRICKS_HOST,
                http_path=settings.DATABRICKS_HTTP_PATH,
                client_id=None,  # These are optional
                client_secret=None
            )
        )
    return _config

# Create single FastAPI app with config dependency
app = FastAPI(
    title="Unity Catalog Swiss Army Knife",
    description="A Databricks App for managing data products, contracts, and more",
    version="1.0.0",
    dependencies=[Depends(get_config)]
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

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the React application's index.html"""
    with open(STATIC_ASSETS_PATH / "index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.exception_handler(404)
async def client_side_routing(_, __):
    """Handle 404 errors by serving the React application's index.html"""
    with open(STATIC_ASSETS_PATH / "index.html", "r") as f:
        html_content = f.read()
    return HTMLResponse(content=html_content)

@app.get("/api/time")
async def get_current_time():
    """Get the current time (for testing purposes mostly)"""
    return {'time': time.time()}

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, debug=True)
