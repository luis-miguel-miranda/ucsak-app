import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException

from api.controller.search_manager import SearchManager
# Import the data products manager dependency
from api.routes.data_product_routes import get_data_products_manager
from api.controller.data_products_manager import DataProductsManager
# TODO: Import other manager dependencies (glossary, contract) if needed

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["search"])

# --- Manager Dependency --- 
_search_manager_instance: Optional[SearchManager] = None

async def get_search_manager(
    # Inject the necessary managers here
    product_manager: DataProductsManager = Depends(get_data_products_manager),
    # TODO: Add Depends(...) for other managers (glossary, contract) 
) -> SearchManager:
    """Dependency to get or create the SearchManager instance with injected sub-managers."""
    global _search_manager_instance
    if _search_manager_instance is None:
        logger.info("Initializing SearchManager instance.")
        # Pass the injected managers to the constructor
        _search_manager_instance = SearchManager(
            product_manager=product_manager,
            # TODO: Pass other managers here
        )
    # TODO: Consider if sub-managers need to be updated on existing instance
    # elif not _search_manager_instance.product_manager and product_manager:
    #     _search_manager_instance.product_manager = product_manager
        
    return _search_manager_instance

# --- Routes --- 
@router.get("/")
async def search_items(
    query: str, 
    manager: SearchManager = Depends(get_search_manager)
) -> List[Dict[str, Any]]: # Return type changed to List
    """Search across indexed items."""
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
    try:
        results = manager.search(query)
        return results
    except Exception as e:
        logger.exception(f"Error during search for query '{query}': {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.post("/rebuild-index", status_code=202) # Use 202 Accepted for async task
async def rebuild_search_index(
    manager: SearchManager = Depends(get_search_manager)
):
    """Triggers a rebuild of the search index."""
    try:
        # In a real app, this might be a background task
        logger.info("Rebuilding search index via API request...")
        manager.build_index()
        logger.info("Search index rebuild completed.")
        return {"message": "Search index rebuild initiated."}
    except Exception as e:
        logger.exception(f"Error during index rebuild: {e}")
        raise HTTPException(status_code=500, detail="Index rebuild failed")

# --- Register Function --- 
def register_routes(app):
    app.include_router(router)
    logger.info("Search routes registered")
