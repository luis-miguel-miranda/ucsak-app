import logging
from typing import Any, Dict, List

from api.controller.business_glossary_manager import BusinessGlossaryManager
from api.controller.data_contract_manager import DataContractManager
from api.controller.data_product_manager import DataProductManager
from api.controller.notification_manager import NotificationManager

logger = logging.getLogger(__name__)

class SearchManager:
    def __init__(self):
        """Initialize search manager with access to other managers."""
        self.notification_manager = NotificationManager()
        self.glossary_manager = BusinessGlossaryManager()
        self.contract_manager = DataContractManager()
        self.product_manager = DataProductManager()

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
