import logging
from typing import Any, Dict, List

from api.controller.business_glossaries_manager import BusinessGlossariesManager
from api.controller.data_contracts_manager import DataContractsManager
from api.controller.data_products_manager import DataProductsManager
from api.controller.notifications_manager import NotificationsManager

logger = logging.getLogger(__name__)

class SearchManager:
    def __init__(self):
        """Initialize search manager with access to other managers."""
        self.notification_manager = NotificationsManager()
        self.glossary_manager = BusinessGlossariesManager()
        self.contract_manager = DataContractsManager()
        self.product_manager = DataProductsManager()

    def search(self, query: str) -> Dict[str, List[Dict[str, Any]]]:
        """Search across all data types.
        
        Args:
            query: Search string to match against items
            
        Returns:
            Dictionary with results grouped by type
        """
        query = query.lower()
        results = {
            "notifications": [],
            "terms": [],
            "contracts": [],
            "products": []
        }

        # Search notifications
        for notification in self.notification_manager.get_notifications():
            if (query in notification.title.lower() or
                (notification.description and query in notification.description.lower())):
                results["notifications"].append({
                    "id": notification.id,
                    "title": notification.title,
                    "type": "notification",
                    "link": f"/notifications/{notification.id}"
                })

        # Search glossary terms
        logger.info(f"Number of terms: {len(self.glossary_manager.list_terms())}")
        for term in self.glossary_manager.list_terms():
            term_name = term.get('name', '')
            term_definition = term.get('definition', '')
            if query in term_name.lower() or query in term_definition.lower():
                results["terms"].append({
                    "id": term.get('id', ''),
                    "title": term_name,
                    "type": "term",
                    "link": f"/business-glossary?term={term.get('id', '')}"
                })

        # Search data contracts
        for contract in self.contract_manager.list_contracts():
            if query in contract.name.lower():
                results["contracts"].append({
                    "id": contract.id,
                    "title": contract.name,
                    "type": "contract",
                    "link": f"/data-contracts/{contract.id}"
                })

        # Search data products
        for product in self.product_manager.list_products():
            if query in product.name.lower():
                results["products"].append({
                    "id": product.id,
                    "title": product.name,
                    "type": "product",
                    "link": f"/data-products/{product.id}"
                })

        logger.info(f"Search results: {results}")
        return results
