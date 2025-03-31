from __future__ import annotations
import sys
import os
from pathlib import Path
from dataclasses import dataclass
from databricks.sdk.core import Config as DatabricksConfig
import logging
from typing import Any, Dict, Optional
import yaml
from pydantic import Field
from pydantic_settings import BaseSettings

from .logging import get_logger

logger = get_logger(__name__)

@dataclass(frozen=True)
class EndpointConfig:
    host: str
    client_id: str
    client_secret: str
    http_path: str

    def to_databricks_config(self) -> DatabricksConfig:
        return DatabricksConfig(
            client_id=self.client_id,
            client_secret=self.client_secret,
            host=f"https://{self.host}",
        )


@dataclass(frozen=True)
class Config:
    catalog: str
    schema: str
    volume: str
    density_table: str = "population_density"
    endpoint: EndpointConfig | None = None

    @property
    def full_table_name(self) -> str:
        return f"{self.catalog}.{self.schema}.{self.density_table}"

    @staticmethod
    def from_args() -> Config:
        args = sys.argv[1:]
        logger.info(f"Arguments: {args}")
        catalog = args[0] if len(args) > 0 else "main"
        schema = args[1] if len(args) > 1 else "terrametria"
        volume = args[2] if len(args) > 2 else "raw"
        return Config(catalog, schema, volume)

    @staticmethod
    def from_env() -> Config:
        catalog = os.getenv("DATABRICKS_CATALOG", "app_data")
        schema = os.getenv("DATABRICKS_SCHEMA", "app_ucsak")
        volume = os.getenv("DATABRICKS_VOLUME", "raw")

        def warehouse_id_to_http_path(wh_id: str) -> str:
            return f"/sql/1.0/warehouses/{wh_id}"

        endpoint_cfg = EndpointConfig(
            host=os.environ["DATABRICKS_HOST"],
            http_path=warehouse_id_to_http_path(os.environ["DATABRICKS_WAREHOUSE_ID"]),
            client_id=os.getenv("DATABRICKS_CLIENT_ID", None),
            client_secret=os.getenv("DATABRICKS_CLIENT_SECRET", None),
        )
        return Config(
            catalog=catalog,
            schema=schema,
            volume=volume,
            endpoint=endpoint_cfg,
        )

class Settings(BaseSettings):
    """Application settings."""
    
    # Database settings
    DATABASE_URL: Optional[str] = Field(None, env='DATABASE_URL')
    
    # Databricks settings
    DATABRICKS_HOST: str = Field(..., env='DATABRICKS_HOST')
    DATABRICKS_TOKEN: str = Field(..., env='DATABRICKS_TOKEN')
    DATABRICKS_WORKSPACE_ID: Optional[str] = Field(None, env='DATABRICKS_WORKSPACE_ID')
    DATABRICKS_HTTP_PATH: str = Field(..., env='DATABRICKS_HTTP_PATH')
    DATABRICKS_WAREHOUSE_ID: str = Field(..., env='DATABRICKS_WAREHOUSE_ID')
    DATABRICKS_CATALOG: str = Field(..., env='DATABRICKS_CATALOG')
    DATABRICKS_SCHEMA: str = Field(..., env='DATABRICKS_SCHEMA')
    DATABRICKS_VOLUME: str = Field(..., env='DATABRICKS_VOLUME')
    
    # Environment
    ENV: str = Field('LOCAL', env='ENV')
    
    # Application settings
    DEBUG: bool = Field(False, env='DEBUG')
    LOG_LEVEL: str = Field('INFO', env='LOG_LEVEL')
    LOG_FILE: Optional[str] = Field(None, env='LOG_FILE')
    
    # Git settings for YAML storage
    GIT_REPO_URL: Optional[str] = Field(None, env='GIT_REPO_URL')
    GIT_BRANCH: str = Field('main', env='GIT_BRANCH')
    GIT_USERNAME: Optional[str] = Field(None, env='GIT_USERNAME')
    GIT_PASSWORD: Optional[str] = Field(None, env='GIT_PASSWORD')
    
    class Config:
        env_file = '.env'
        case_sensitive = True

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
            with open(file_path, 'r') as f:
                return yaml.safe_load(f)
        except yaml.YAMLError as e:
            logger.error(f"Error loading YAML file {filename}: {str(e)}")
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
            logger.error(f"Error saving YAML file {filename}: {str(e)}")
            raise

# Global configuration instances
settings: Optional[Settings] = None
config_manager: Optional[ConfigManager] = None

def init_config() -> None:
    """Initialize the global configuration instances."""
    global settings, config_manager
    settings = Settings()
    config_manager = ConfigManager(settings)

def get_settings() -> Settings:
    """Get the global settings instance.
    
    Returns:
        Application settings
        
    Raises:
        RuntimeError: If settings are not initialized
    """
    if not settings:
        raise RuntimeError("Settings not initialized")
    return settings

def get_config() -> ConfigManager:
    """Get the global configuration manager instance.
    
    Returns:
        Configuration manager
        
    Raises:
        RuntimeError: If configuration manager is not initialized
    """
    if not config_manager:
        raise RuntimeError("Configuration manager not initialized")
    return config_manager