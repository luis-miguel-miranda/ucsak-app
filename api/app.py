import logging
import mimetypes
import time
from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.responses import Response

from api.common.config import get_settings, init_config, Settings
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
from api.common.database import init_db, get_session_factory, SQLAlchemySession
from api.controller.data_products_manager import DataProductsManager

# Initialize configuration and logging first
init_config()
settings = get_settings()
setup_logging(level=settings.LOG_LEVEL, log_file=settings.LOG_FILE)
logger = get_logger(__name__)

logger.info(f"Starting application in {settings.ENV} mode.")
logger.info(f"Debug mode: {settings.DEBUG}")

# --- Helper Functions (Define BEFORE App Instantiation) ---

# --- Demo Data Loading Function ---
def load_demo_data(db_session: SQLAlchemySession, settings: Settings):
    """Loads demo data if demo mode is enabled and tables are empty."""
    logger.info(f"Inside load_demo_data. Checking APP_DEMO_MODE: {settings.APP_DEMO_MODE}")
    if not settings.APP_DEMO_MODE:
        logger.info("Demo mode is disabled. Skipping demo data loading.")
        return

    logger.info("Demo mode is enabled. Checking if demo data needs to be loaded...")
    
    # --- Data Products --- 
    try:
        logger.debug("Checking Data Products for demo data loading...")
        dp_manager = DataProductsManager(db=db_session)
        if dp_manager._repo.is_empty(db=db_session): 
            YAML_PATH = Path('api/data/data_products.yaml')
            if YAML_PATH.exists():
                logger.info(f"Data Products table is empty. Loading demo data from {YAML_PATH}...")
                success = dp_manager.load_from_yaml(str(YAML_PATH))
                if success:
                    logger.info("Successfully loaded demo data for Data Products.")
                else:
                    logger.error("Failed to load demo data for Data Products.")
            else:
                logger.warning(f"Demo mode enabled but {YAML_PATH} not found.")
        else:
            logger.info("Data Products table is not empty. Skipping demo data loading.")
    except Exception as e:
         logger.error(f"Error during Data Products demo data check/load: {e}", exc_info=True)

    # --- Add similar blocks for other services --- 

# --- Application Lifecycle Events ---

# Application Startup Event
async def startup_event():
    logger.info("Running application startup event...")
    
    # 1. Initialize database connection, create catalog/schema, and apply migrations
    try:
        init_db() 
        logger.info("Database initialization complete.")
    except ConnectionError as e:
         logger.critical(f"Database connection/initialization failed on startup: {e}", exc_info=True)
         raise RuntimeError("Application cannot start without database connection.") from e
    except Exception as e:
         logger.critical(f"An unexpected error occurred during startup database initialization: {e}", exc_info=True)
         raise RuntimeError("Application cannot start due to database initialization error.") from e

    # 2. Load Demo Data (conditionally)
    db_session = None 
    try:
        # Get the factory *after* init_db has run
        CurrentSessionFactory = get_session_factory()
        # Directly try to create the session using the retrieved factory
        db_session = CurrentSessionFactory()
        current_settings = get_settings()
        logger.info(f"Attempting demo data load. Session created. Demo mode from settings: {current_settings.APP_DEMO_MODE}")
        load_demo_data(db_session=db_session, settings=current_settings)
        logger.info("Completed call to load_demo_data.")
        db_session.commit()
    except RuntimeError as e:
        # Catch error if get_session_factory indicates factory wasn't initialized
        logger.error(f"Cannot load demo data: {e}") 
    except Exception as e:
        logger.error(f"Error during demo data loading execution: {e}", exc_info=True)
        if db_session: # Rollback only if session was created
            db_session.rollback()
    finally:
        if db_session: # Close only if session was created
            db_session.close()
            logger.info("Demo data DB session closed.")

    logger.info("Application startup complete.")

# Application Shutdown Event
async def shutdown_event():
    logger.info("Running application shutdown event...")
    logger.info("Application shutdown complete.")

# --- FastAPI App Instantiation (AFTER defining lifecycle functions) ---

# Define paths
STATIC_ASSETS_PATH = Path(__file__).parent.parent / "static"
logger.info(f"STATIC_ASSETS_PATH: {STATIC_ASSETS_PATH}")

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('image/png', '.png')

# Create single FastAPI app with settings dependency
app = FastAPI(
    title="Unity Catalog Swiss Army Knife",
    description="A Databricks App for managing data products, contracts, and more",
    version="1.0.0",
    dependencies=[Depends(get_settings)],
    on_startup=[startup_event],
    on_shutdown=[shutdown_event]
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
