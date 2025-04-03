import logging

from fastapi import APIRouter, Query

from api.controller.search_manager import SearchManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["search"])
search_manager = SearchManager()

@router.get('/search')
async def search(q: str = Query('')):
    """Search across all data types."""
    if not q:
        return {
            "notifications": [],
            "terms": [],
            "contracts": [],
            "products": []
        }

    try:
        logger.info(f"Searching for: {q}")
        results = search_manager.search(q)
        return results
    except Exception as e:
        logger.error(f"Error during search: {e!s}")
        return {'error': str(e)}

def register_routes(app):
    """Register search routes with the FastAPI app."""
    app.include_router(router)
    logger.info("Registered search routes")
