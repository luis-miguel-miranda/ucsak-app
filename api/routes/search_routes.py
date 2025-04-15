import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException

from api.controller.search_manager import SearchManager
# Import the manager dependency functions/instances
from api.routes.data_product_routes import get_data_products_manager
# Import the glossary manager instance directly
from api.routes.business_glossary_routes import glossary_manager as business_glossary_manager_instance 
# Import the contract manager instance directly
from api.routes.data_contract_routes import contract_manager as data_contract_manager_instance 
# Import the actual manager types for type hinting
from api.controller.data_products_manager import DataProductsManager
from api.controller.business_glossaries_manager import BusinessGlossariesManager
from api.controller.data_contracts_manager import DataContractsManager
# Import the search interfaces
from api.common.search_interfaces import SearchableAsset, SearchIndexItem

# Configure logging
from api.common.logging import setup_logging, get_logger
setup_logging(level=logging.INFO)
logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["search"])

# --- Manager Dependency ---
_search_manager_instance: Optional[SearchManager] = None

async def get_search_manager(
    # Inject managers that use Depends
    product_manager: DataProductsManager = Depends(get_data_products_manager),
    # Contract manager is now injected via direct import below
    # Glossary manager is now injected via direct import below
) -> SearchManager:
    """Dependency to get or create the SearchManager instance with injected searchable managers."""
    global _search_manager_instance
    if _search_manager_instance is None:
        # Collect managers 
        searchable_managers: List[SearchableAsset] = []
        if isinstance(product_manager, SearchableAsset):
            searchable_managers.append(product_manager)
        else:
             logger.warning("DataProductsManager does not implement SearchableAsset or failed injection.")
             
        if isinstance(data_contract_manager_instance, SearchableAsset):
             searchable_managers.append(data_contract_manager_instance)
        else:
             logger.warning("Imported data_contract_manager_instance does not implement SearchableAsset.")

        if isinstance(business_glossary_manager_instance, SearchableAsset):
             searchable_managers.append(business_glossary_manager_instance)
        else:
             logger.warning("Imported business_glossary_manager_instance does not implement SearchableAsset.")

        if len(searchable_managers) < 3: 
            logger.warning(f"Only {len(searchable_managers)} searchable managers were collected (expected 3).")
        else:
             logger.info(f"{len(searchable_managers)} searchable managers collected.")
             
        try:
            _search_manager_instance = SearchManager(
                searchable_managers=searchable_managers
            )
        except Exception as e:
             logger.exception("--- !!! FAILED TO INSTANTIATE SearchManager !!! ---")
             raise e 
    return _search_manager_instance

# --- Routes ---
@router.get("/search", response_model=List[SearchIndexItem])
async def search_items(
    search_term: str,
    manager: SearchManager = Depends(get_search_manager)
) -> List[SearchIndexItem]:
    """Search across indexed items."""
    if not search_term:
        raise HTTPException(status_code=400, detail="Query parameter (search_term) is required")
    try:
        results = manager.search(search_term)
        return results
    except Exception as e:
        logger.exception(f"Error during search for query '{search_term}': {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@router.post("/search/rebuild-index", status_code=202)
async def rebuild_search_index(
    manager: SearchManager = Depends(get_search_manager)
):
    """Triggers a rebuild of the search index."""
    try:
        # In a real app, this might be a background task
        manager.build_index()
        return {"message": "Search index rebuild initiated."}
    except Exception as e:
        logger.exception(f"Error during index rebuild: {e}")
        raise HTTPException(status_code=500, detail="Index rebuild failed")

# --- Register Function --- 
def register_routes(app):
    app.include_router(router)
    logger.info("Search routes registered")
