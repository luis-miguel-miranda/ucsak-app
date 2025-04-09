from pydantic import BaseModel

# Structure for returning metastore table info
class MetastoreTableInfo(BaseModel):
    catalog_name: str
    schema_name: str
    table_name: str
    full_name: str # Helper for display/selection

# Add other metadata models here later (e.g., CatalogInfo, SchemaInfo, ClusterInfo) 