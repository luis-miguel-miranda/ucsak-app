from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from enum import Enum
import uuid

class ContractStatus(Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    DEPRECATED = "deprecated"
    ARCHIVED = "archived"

class DataType(Enum):
    STRING = "string"
    INTEGER = "integer"
    LONG = "long"
    FLOAT = "float"
    DOUBLE = "double"
    BOOLEAN = "boolean"
    DATE = "date"
    TIMESTAMP = "timestamp"
    BINARY = "binary"
    ARRAY = "array"
    STRUCT = "struct"
    MAP = "map"

class SecurityClassification(Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"
    SENSITIVE = "sensitive"

@dataclass
class Metadata:
    domain: str
    owner: str
    tags: Dict[str, str] = field(default_factory=dict)
    subdomain: Optional[str] = None
    steward: Optional[str] = None
    business_description: Optional[str] = None
    technical_description: Optional[str] = None

@dataclass
class Quality:
    rules: List[str]
    scores: Dict[str, float]
    metrics: Dict[str, Any]
    last_validated: Optional[datetime] = None

@dataclass
class Security:
    classification: SecurityClassification
    pii_data: bool = False
    compliance_labels: List[str] = field(default_factory=list)
    access_control: Dict[str, List[str]] = field(default_factory=dict)
    encryption_required: bool = False

@dataclass
class ColumnDefinition:
    name: str
    data_type: DataType
    comment: Optional[str] = None
    nullable: bool = True
    default_value: Optional[Any] = None
    precision: Optional[int] = None
    scale: Optional[int] = None
    is_unique: bool = False
    validation_rules: List[str] = field(default_factory=list)
    security: Optional[Security] = None
    business_name: Optional[str] = None
    tags: Dict[str, str] = field(default_factory=dict)

@dataclass
class DatasetSchema:
    columns: List[ColumnDefinition]
    primary_key: Optional[List[str]] = None
    partition_columns: Optional[List[str]] = None
    clustering_columns: Optional[List[str]] = None
    dependencies: List[str] = field(default_factory=list)
    version: str = "1.0"

@dataclass
class DatasetLifecycle:
    retention_period: Optional[str] = None
    delete_after: Optional[datetime] = None
    archive_after: Optional[datetime] = None
    update_frequency: Optional[str] = None
    last_updated: Optional[datetime] = None
    is_active: bool = True

@dataclass
class Dataset:
    name: str
    type: str  # 'table' or 'view'
    schema: DatasetSchema
    metadata: Metadata
    quality: Quality
    security: Security
    lifecycle: DatasetLifecycle
    description: Optional[str] = None
    location: Optional[str] = None  # for external tables
    view_definition: Optional[str] = None  # for views
    format: Optional[str] = None  # file format for external tables
    constraints: Dict[str, Any] = field(default_factory=dict)

@dataclass
class DataContract:
    id: str
    name: str
    version: str
    status: ContractStatus
    datasets: List[Dataset]
    metadata: Metadata
    created_at: datetime
    updated_at: datetime
    effective_from: Optional[datetime] = None
    effective_until: Optional[datetime] = None
    dependencies: List[str] = field(default_factory=list)
    validation_rules: List[str] = field(default_factory=list)
    sla: Optional[Dict[str, Any]] = None
    terms_and_conditions: Optional[str] = None

class DataContractManager:
    def __init__(self):
        self._contracts: Dict[str, DataContract] = {}

    def create_contract(self, 
                       name: str,
                       version: str,
                       metadata: Metadata,
                       datasets: List[Dataset],
                       validation_rules: List[str],
                       effective_from: Optional[datetime] = None,
                       effective_until: Optional[datetime] = None,
                       dependencies: Optional[List[str]] = None,
                       sla: Optional[Dict[str, Any]] = None,
                       terms_and_conditions: Optional[str] = None) -> DataContract:
        contract_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        contract = DataContract(
            id=contract_id,
            name=name,
            version=version,
            status=ContractStatus.DRAFT,
            datasets=datasets,
            metadata=metadata,
            created_at=now,
            updated_at=now,
            effective_from=effective_from,
            effective_until=effective_until,
            dependencies=dependencies or [],
            validation_rules=validation_rules,
            sla=sla,
            terms_and_conditions=terms_and_conditions
        )
        
        self._contracts[contract_id] = contract
        return contract

    def add_dataset_to_contract(self,
                              contract_id: str,
                              dataset: Dataset) -> Optional[DataContract]:
        contract = self._contracts.get(contract_id)
        if not contract:
            return None
        
        contract.datasets.append(dataset)
        contract.updated_at = datetime.utcnow()
        return contract

    def update_dataset_in_contract(self,
                                 contract_id: str,
                                 dataset_name: str,
                                 updated_dataset: Dataset) -> Optional[DataContract]:
        contract = self._contracts.get(contract_id)
        if not contract:
            return None
        
        for i, dataset in enumerate(contract.datasets):
            if dataset.name == dataset_name:
                contract.datasets[i] = updated_dataset
                contract.updated_at = datetime.utcnow()
                return contract
        
        return None

    def remove_dataset_from_contract(self,
                                   contract_id: str,
                                   dataset_name: str) -> Optional[DataContract]:
        contract = self._contracts.get(contract_id)
        if not contract:
            return None
        
        contract.datasets = [d for d in contract.datasets if d.name != dataset_name]
        contract.updated_at = datetime.utcnow()
        return contract

    def list_contracts(self) -> List[DataContract]:
        return list(self._contracts.values())

    def get_contract(self, contract_id: str) -> Optional[DataContract]:
        return self._contracts.get(contract_id)

    def update_contract(self,
                       contract_id: str,
                       name: Optional[str] = None,
                       version: Optional[str] = None,
                       metadata: Optional[Metadata] = None,
                       status: Optional[ContractStatus] = None,
                       validation_rules: Optional[List[str]] = None) -> Optional[DataContract]:
        
        contract = self._contracts.get(contract_id)
        if not contract:
            return None

        if name is not None:
            contract.name = name
        if version is not None:
            contract.version = version
        if metadata is not None:
            contract.metadata = metadata
        if status is not None:
            contract.status = status
        if validation_rules is not None:
            contract.validation_rules = validation_rules

        contract.updated_at = datetime.utcnow()
        return contract

    def delete_contract(self, contract_id: str) -> bool:
        if contract_id in self._contracts:
            del self._contracts[contract_id]
            return True
        return False

    def validate_schema(self, schema: DatasetSchema) -> List[str]:
        errors = []
        column_names = set()
        
        for column in schema.columns:
            if column.name in column_names:
                errors.append(f"Duplicate column name: {column.name}")
            column_names.add(column.name)
            
            if schema.primary_key and column.name in schema.primary_key and column.nullable:
                errors.append(f"Primary key column {column.name} cannot be nullable")
                
        if schema.primary_key:
            for pk_column in schema.primary_key:
                if pk_column not in column_names:
                    errors.append(f"Primary key column {pk_column} not found in schema")
                    
        if schema.partition_columns:
            for part_column in schema.partition_columns:
                if part_column not in column_names:
                    errors.append(f"Partition column {part_column} not found in schema")
                    
        return errors 

    def validate_contract(self, contract: DataContract) -> List[str]:
        errors = []
        
        # Validate metadata
        if not contract.metadata.domain:
            errors.append("Domain is required in metadata")
        if not contract.metadata.owner:
            errors.append("Owner is required in metadata")
            
        # Validate datasets
        dataset_names = set()
        for dataset in contract.datasets:
            if dataset.name in dataset_names:
                errors.append(f"Duplicate dataset name: {dataset.name}")
            dataset_names.add(dataset.name)
            
            # Validate schema
            schema_errors = self.validate_schema(dataset.schema)
            errors.extend([f"Dataset {dataset.name}: {error}" for error in schema_errors])
            
            # Validate security
            if dataset.security.classification == SecurityClassification.RESTRICTED:
                if not dataset.security.access_control:
                    errors.append(f"Dataset {dataset.name}: Access control required for restricted data")
                    
        # Validate contract dates
        if contract.effective_until and contract.effective_from:
            if contract.effective_until < contract.effective_from:
                errors.append("Effective until date must be after effective from date")
                
        return errors 