import logging
from typing import Any, Dict, List

from api.controller.business_glossaries_manager import BusinessGlossariesManager
from api.controller.data_contracts_manager import DataContractsManager
from api.controller.data_products_manager import DataProductsManager
from api.controller.notifications_manager import NotificationsManager
from api.models.data_products import DataProduct

logger = logging.getLogger(__name__)

class SearchManager:
    def __init__(self, product_manager: DataProductsManager):
        """Initialize search manager with access to other managers."""
        self.notification_manager = NotificationsManager()
        self.glossary_manager = BusinessGlossariesManager()
        self.contract_manager = DataContractsManager()
        self.product_manager = product_manager
        self.index: List[Dict[str, Any]] = []
        self.build_index()

    def build_index(self):
        """Builds or rebuilds the search index from available managers."""
        logger.info("Building search index...")
        self.index = []

        # Index Data Products
        if self.product_manager:
            try:
                products = self.product_manager.list_products()
                for product in products:
                    self.index.append({
                        'id': f"product::{product.id}",
                        'type': 'Data Product',
                        'name': product.info.title,
                        'description': product.info.description or '',
                        'tags': product.tags or [],
                        'owner': product.info.owner,
                        'url': f"/data-products/{product.id}"
                    })
                logger.info(f"Indexed {len(products)} data products.")
            except Exception as e:
                logger.error(f"Failed to index data products: {e}")
        else:
             logger.warning("DataProductsManager not available for indexing.")

        # TODO: Index Data Contracts
        # logger.info("Indexing data contracts...")
        # try:
        #    contracts = self.contract_manager.list_contracts()
        #    for contract in contracts:
        #        self.index.append({...})
        # except Exception as e:
        #    logger.error(f"Failed to index data contracts: {e}")

        # TODO: Index Business Glossary Terms
        # logger.info("Indexing glossary terms...")
        # try:
        #    terms = self.glossary_manager.list_all_terms()
        #    for term in terms:
        #        self.index.append({...})
        # except Exception as e:
        #    logger.error(f"Failed to index glossary terms: {e}")

        logger.info(f"Search index build complete. Total items: {len(self.index)}")

    def search(self, query: str) -> List[Dict[str, Any]]:
        """Performs a simple case-insensitive search on name, description, tags."""
        if not query:
            return []
        
        query_lower = query.lower()
        results = []
        for item in self.index:
            if (query_lower in item['name'].lower() or 
                query_lower in item['description'].lower() or 
                any(query_lower in str(tag).lower() for tag in item.get('tags', []))):
                results.append(item)
                
        logger.info(f"Search for '{query}' returned {len(results)} results.")
        return results
