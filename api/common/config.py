from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from pydantic import model_validator

from .logging import get_logger

logger = get_logger(__name__)

# Define paths
DOTENV_FILE = Path(__file__).parent.parent.parent / Path(".env")

class Settings(BaseSettings):
    """Application settings."""

    # Database settings
    DATABASE_URL: Optional[str] = Field(None, env='DATABASE_URL')

    # Databricks connection settings
    DATABRICKS_HOST: str
    DATABRICKS_WAREHOUSE_ID: str
    DATABRICKS_CATALOG: str
    DATABRICKS_SCHEMA: str
    DATABRICKS_VOLUME: str
    DATABRICKS_TOKEN: Optional[str] = None  # Optional since handled by SDK
    DATABRICKS_HTTP_PATH: Optional[str] = None # Will be computed by validator

    # Environment
    ENV: str = "PROD"  # LOCAL, DEV, PROD

    # Application settings
    DEBUG: bool = Field(False, env='DEBUG')
    LOG_LEVEL: str = Field('INFO', env='LOG_LEVEL')
    LOG_FILE: Optional[str] = Field(None, env='LOG_FILE')

    # Git settings for YAML storage
    GIT_REPO_URL: Optional[str] = Field(None, env='GIT_REPO_URL')
    GIT_BRANCH: str = Field('main', env='GIT_BRANCH')
    GIT_USERNAME: Optional[str] = Field(None, env='GIT_USERNAME')
    GIT_PASSWORD: Optional[str] = Field(None, env='GIT_PASSWORD')

    # Job settings
    job_cluster_id: Optional[str] = None
    sync_enabled: bool = False
    sync_repository: Optional[str] = None
    enabled_jobs: List[str] = Field(default_factory=list)
    updated_at: Optional[datetime] = None

    # Demo Mode Flag
    APP_DEMO_MODE: bool = Field(False, env='APP_DEMO_MODE')

    class Config:
        env_file = DOTENV_FILE
        case_sensitive = True

    @model_validator(mode='after')
    def compute_databricks_http_path(self) -> 'Settings':
        """Compute the DATABRICKS_HTTP_PATH after validation."""
        if self.DATABRICKS_WAREHOUSE_ID:
            self.DATABRICKS_HTTP_PATH = f"/sql/1.0/warehouses/{self.DATABRICKS_WAREHOUSE_ID}"
        return self

    def to_dict(self):
        return {
            'job_cluster_id': self.job_cluster_id,
            'sync_enabled': self.sync_enabled,
            'sync_repository': self.sync_repository,
            'enabled_jobs': self.enabled_jobs,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class ConfigManager:
    """Manages application configuration and YAML files."""

    def __init__(self, settings: Settings) -> None:
        """Initialize the configuration manager.
        
        Args:
            settings: Application settings
        """
        self.settings = settings
        self.data_dir = Path('api/data')
        self.data_dir.mkdir(parents=True, exist_ok=True)

    def load_yaml(self, filename: str) -> Dict[str, Any]:
        """Load a YAML file from the data directory.
        
        Args:
            filename: Name of the YAML file
            
        Returns:
            Dictionary containing the YAML data
            
        Raises:
            FileNotFoundError: If the file doesn't exist
            yaml.YAMLError: If the file contains invalid YAML
        """
        file_path = self.data_dir / filename
        if not file_path.exists():
            raise FileNotFoundError(f"YAML file not found: {filename}")

        try:
            with open(file_path) as f:
                return yaml.safe_load(f)
        except yaml.YAMLError as e:
            logger.error(f"Error loading YAML file {filename}: {e!s}")
            raise

    def save_yaml(self, filename: str, data: Dict[str, Any]) -> None:
        """Save data to a YAML file in the data directory.
        
        Args:
            filename: Name of the YAML file
            data: Dictionary to save as YAML
            
        Raises:
            yaml.YAMLError: If there's an error writing the YAML
        """
        file_path = self.data_dir / filename
        try:
            with open(file_path, 'w') as f:
                yaml.dump(data, f, default_flow_style=False)
        except yaml.YAMLError as e:
            logger.error(f"Error saving YAML file {filename}: {e!s}")
            raise

# Global configuration instances
_settings: Optional[Settings] = None
_config_manager: Optional[ConfigManager] = None

def init_config() -> None:
    """Initialize the global configuration instances."""
    global _settings, _config_manager

    # Load environment variables from .env file if it exists
    if DOTENV_FILE.exists():
        logger.info(f"Loading environment from {DOTENV_FILE}")
        _settings = Settings(_env_file=DOTENV_FILE)
    else:
        logger.info("No .env file found, using existing environment variables")
        _settings = Settings()

    logger.info(f"Initializing config manager with settings: {_settings}")
    _config_manager = ConfigManager(_settings)

def get_settings() -> Settings:
    """Get the global settings instance.
    
    Returns:
        Application settings
        
    Raises:
        RuntimeError: If settings are not initialized
    """
    if not _settings:
        raise RuntimeError("Settings not initialized")
    return _settings

def get_config_manager() -> ConfigManager:
    """Get the global configuration manager instance.
    
    Returns:
        Configuration manager
        
    Raises:
        RuntimeError: If configuration manager is not initialized
    """
    if not _config_manager:
        raise RuntimeError("Configuration manager not initialized")
    return _config_manager
