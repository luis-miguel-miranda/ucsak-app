import logging
from pathlib import Path
from typing import Dict, List, Optional

import yaml

from api.models.security_features import SecurityFeature

logger = logging.getLogger(__name__)

class SecurityFeaturesManager:
    def __init__(self):
        logging.info("Initializing SecurityFeaturesManager...")
        self.features: Dict[str, SecurityFeature] = {}
        # Load sample data on initialization
        yaml_path = Path(__file__).parent.parent / 'data' / 'security_features.yaml'
        logging.info(f"Loading sample data from {yaml_path}")
        self.load_from_yaml(yaml_path)
        logging.info("SecurityFeaturesManager initialized")

    def create_feature(self, feature: SecurityFeature) -> SecurityFeature:
        logging.info(f"Creating security feature: {feature}")
        self.features[feature.id] = feature
        logging.info(f"Created security feature: {self.features[feature.id]}")
        return feature

    def get_feature(self, feature_id: str) -> Optional[SecurityFeature]:
        logging.info(f"Getting security feature: {feature_id}")
        feature = self.features.get(feature_id)
        logging.info(f"Found security feature: {feature}")
        return feature

    def list_features(self) -> List[SecurityFeature]:
        try:
            logger.info("Listing security features...")
            features = list(self.features.values())
            logger.info(f"Found {len(features)} security features")
            for feature in features:
                try:
                    logger.info(f"Feature ID: {feature.id}")
                    logger.info(f"Feature type: {feature.type}")
                    logger.info(f"Feature dict: {feature.to_dict()}")
                    # Verify the feature can be converted to dict
                    feature_dict = feature.to_dict()
                    logger.info(f"Feature dict verified: {feature_dict}")
                except Exception as e:
                    logger.error(f"Error processing feature {feature.id if hasattr(feature, 'id') else 'unknown'}")
                    logger.error(f"Error: {e!s}")
                    import traceback
                    logger.error(f"Stack trace: {traceback.format_exc()}")
                    raise
            return features
        except Exception as e:
            logger.error(f"Error in list_features: {e!s}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise

    def update_feature(self, feature_id: str, feature: SecurityFeature) -> Optional[SecurityFeature]:
        logging.info(f"Updating security feature: {feature_id}")
        if feature_id not in self.features:
            logging.warning(f"Security feature not found: {feature_id}")
            return None
        self.features[feature_id] = feature
        logging.info(f"Updated security feature: {self.features[feature_id]}")
        return feature

    def delete_feature(self, feature_id: str) -> bool:
        logging.info(f"Deleting security feature: {feature_id}")
        if feature_id not in self.features:
            logging.warning(f"Security feature not found: {feature_id}")
            return False
        del self.features[feature_id]
        logging.info(f"Deleted security feature: {feature_id}")
        return True

    def load_from_yaml(self, yaml_path: Path) -> None:
        try:
            logger.info(f"Loading security features from {yaml_path}")
            if not yaml_path.exists():
                logger.warning(f"YAML file not found at {yaml_path}")
                return
            with open(yaml_path) as f:
                data = yaml.safe_load(f)
                logger.info(f"Loaded YAML data: {data}")
                if not data or 'features' not in data:
                    logger.warning("No features found in YAML data")
                    return
                for feature_data in data['features']:
                    try:
                        logger.info(f"Processing feature data: {feature_data}")
                        feature = SecurityFeature.from_dict(feature_data)
                        logger.info(f"Created feature: {feature.to_dict()}")
                        self.features[feature.id] = feature
                    except Exception as e:
                        logger.error(f"Error processing feature data: {feature_data}")
                        logger.error(f"Error: {e!s}")
                        import traceback
                        logger.error(f"Stack trace: {traceback.format_exc()}")
                        raise
                logger.info(f"Successfully loaded {len(self.features)} security features")
        except Exception as e:
            logger.error(f"Error loading security features from YAML: {e!s}")
            logger.error(f"Error type: {type(e)}")
            import traceback
            logger.error(f"Stack trace: {traceback.format_exc()}")
            raise

    def save_to_yaml(self, yaml_path: Path) -> None:
        try:
            logging.info(f"Saving security features to {yaml_path}")
            data = {'features': [feature.to_dict() for feature in self.features.values()]}
            logging.info(f"Saving data: {data}")
            with open(yaml_path, 'w') as f:
                yaml.dump(data, f)
            logging.info(f"Successfully saved {len(self.features)} security features")
        except Exception as e:
            logging.exception(f"Error saving security features to YAML: {e!s}")
            raise
