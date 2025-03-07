from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from enum import Enum
import uuid
import os
import yaml
from pathlib import Path


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

        contract.datasets = [
            d for d in contract.datasets if d.name != dataset_name]
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
                errors.append(
                    f"Primary key column {column.name} cannot be nullable")

        if schema.primary_key:
            for pk_column in schema.primary_key:
                if pk_column not in column_names:
                    errors.append(
                        f"Primary key column {pk_column} not found in schema")

        if schema.partition_columns:
            for part_column in schema.partition_columns:
                if part_column not in column_names:
                    errors.append(
                        f"Partition column {part_column} not found in schema")

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
            errors.extend(
                [f"Dataset {dataset.name}: {error}" for error in schema_errors])

            # Validate security
            if dataset.security.classification == SecurityClassification.RESTRICTED:
                if not dataset.security.access_control:
                    errors.append(
                        f"Dataset {dataset.name}: Access control required for restricted data")

        # Validate contract dates
        if contract.effective_until and contract.effective_from:
            if contract.effective_until < contract.effective_from:
                errors.append(
                    "Effective until date must be after effective from date")

        return errors

    def initialize_example_data(self):
        """Initialize example data contracts"""
        # Create metadata for contracts
        customer_metadata = Metadata(
            domain="customer",
            owner="Data Governance Team",
            tags={"source": "CRM", "criticality": "high"}
        )

        product_metadata = Metadata(
            domain="product",
            owner="Product Team",
            tags={"source": "ERP", "criticality": "medium"}
        )

        # Create column definitions for customer contract
        customer_columns = [
            ColumnDefinition(
                name="customer_id",
                data_type=DataType.STRING,
                comment="Unique identifier for customer",
                nullable=False,
                is_unique=True
            ),
            ColumnDefinition(
                name="full_name",
                data_type=DataType.STRING,
                comment="Customer's full name",
                nullable=False
            ),
            ColumnDefinition(
                name="email",
                data_type=DataType.STRING,
                comment="Primary email address",
                nullable=False
            )
        ]

        # Create column definitions for product contract
        product_columns = [
            ColumnDefinition(
                name="product_id",
                data_type=DataType.STRING,
                comment="Unique product identifier",
                nullable=False,
                is_unique=True
            ),
            ColumnDefinition(
                name="name",
                data_type=DataType.STRING,
                comment="Product name",
                nullable=False
            ),
            ColumnDefinition(
                name="price",
                data_type=DataType.DOUBLE,
                comment="Current price",
                nullable=False
            )
        ]

        # Create schemas
        customer_schema = DatasetSchema(
            columns=customer_columns,
            primary_key=["customer_id"],
            version="1.0"
        )

        product_schema = DatasetSchema(
            columns=product_columns,
            primary_key=["product_id"],
            version="1.0"
        )

        # Create quality objects
        quality = Quality(
            rules=["completeness > 0.95", "accuracy > 0.9"],
            scores={"completeness": 0.98, "accuracy": 0.95},
            metrics={"record_count": 10000}
        )

        # Create security objects
        customer_security = Security(
            classification=SecurityClassification.CONFIDENTIAL,
            pii_data=True,
            compliance_labels=["GDPR", "CCPA"]
        )

        product_security = Security(
            classification=SecurityClassification.INTERNAL,
            pii_data=False
        )

        # Create lifecycle objects
        lifecycle = DatasetLifecycle(
            retention_period="1 year",
            update_frequency="daily"
        )

        # Create datasets
        customer_dataset = Dataset(
            name="customer_data",
            type="table",
            schema=customer_schema,
            metadata=customer_metadata,
            quality=quality,
            security=customer_security,
            lifecycle=lifecycle,
            description="Master customer data"
        )

        product_dataset = Dataset(
            name="product_catalog",
            type="table",
            schema=product_schema,
            metadata=product_metadata,
            quality=quality,
            security=product_security,
            lifecycle=lifecycle,
            description="Product catalog information"
        )

        # Create contracts
        self.create_contract(
            name="Customer Data Contract",
            version="1.0",
            metadata=customer_metadata,
            datasets=[customer_dataset],
            validation_rules=["All customer IDs must be unique",
                              "Email addresses must be valid"],
            effective_from=datetime(2024, 1, 1),
            terms_and_conditions="Standard terms apply"
        )

        self.create_contract(
            name="Product Catalog Contract",
            version="1.0",
            metadata=product_metadata,
            datasets=[product_dataset],
            validation_rules=[
                "All product IDs must be unique", "Prices must be positive"],
            effective_from=datetime(2024, 1, 2),
            terms_and_conditions="Standard terms apply"
        )

    def load_from_yaml(self, yaml_path):
        """Load data contracts from a YAML file"""
        try:
            with open(yaml_path, 'r') as file:
                data = yaml.safe_load(file)

            # Process each contract in the YAML file
            for contract_data in data.get('contracts', []):
                # Create metadata
                metadata = Metadata(
                    domain=contract_data.get('domain', 'default'),
                    owner=contract_data.get('owner', 'Unknown'),
                    business_description=contract_data.get('description', '')
                )

                # Process datasets
                datasets = []
                for dataset_data in contract_data.get('datasets', []):
                    # Create column definitions
                    columns = []
                    for column_data in dataset_data.get('schema', {}).get('columns', []):
                        columns.append(ColumnDefinition(
                            name=column_data.get('name'),
                            data_type=DataType[column_data.get(
                                'type', 'STRING').upper()],
                            comment=column_data.get('description', ''),
                            nullable=column_data.get('nullable', True),
                            is_unique=column_data.get('is_unique', False)
                        ))

                    # Create schema
                    schema = DatasetSchema(
                        columns=columns,
                        primary_key=dataset_data.get(
                            'schema', {}).get('primary_key', []),
                        version=dataset_data.get(
                            'schema', {}).get('version', '1.0')
                    )

                    # Create security
                    security = Security(
                        classification=SecurityClassification[dataset_data.get(
                            'security', {}).get('classification', 'INTERNAL').upper()],
                        pii_data=dataset_data.get(
                            'security', {}).get('pii_data', False),
                        compliance_labels=dataset_data.get(
                            'security', {}).get('compliance_labels', [])
                    )

                    # Create quality
                    quality = Quality(
                        rules=dataset_data.get('quality', {}).get('rules', []),
                        scores=dataset_data.get(
                            'quality', {}).get('scores', {}),
                        metrics=dataset_data.get(
                            'quality', {}).get('metrics', {})
                    )

                    # Create lifecycle
                    lifecycle = DatasetLifecycle(
                        retention_period=dataset_data.get(
                            'lifecycle', {}).get('retention_period', None),
                        update_frequency=dataset_data.get(
                            'lifecycle', {}).get('update_frequency', None)
                    )

                    # Create dataset
                    datasets.append(Dataset(
                        name=dataset_data.get('name'),
                        type=dataset_data.get('type', 'table'),
                        schema=schema,
                        metadata=metadata,
                        quality=quality,
                        security=security,
                        lifecycle=lifecycle,
                        description=dataset_data.get('description', '')
                    ))

                # Create contract
                self.create_contract(
                    name=contract_data.get('name'),
                    version=contract_data.get('version', '1.0'),
                    metadata=metadata,
                    datasets=datasets,
                    validation_rules=contract_data.get('validation_rules', []),
                    effective_from=contract_data.get('effective_from'),
                    terms_and_conditions=contract_data.get(
                        'terms_and_conditions', '')
                )

            return True
        except Exception as e:
            print(f"Error loading YAML data: {e}")
            return False

    def validate_odcs_format(self, data: Dict) -> bool:
        """Validate if the data follows ODCS v3 format"""
        required_fields = ['name', 'version', 'datasets']
        if not all(field in data for field in required_fields):
            return False
        
        # Add more validation as needed
        return True

    def create_from_odcs(self, data: Dict) -> DataContract:
        """Create a data contract from ODCS v3 format"""
        # Convert ODCS metadata
        metadata = Metadata(
            domain=data.get('domain', 'default'),
            owner=data.get('owner', 'Unknown'),
            tags=data.get('tags', {}),
            business_description=data.get('description', '')
        )
        
        # Convert ODCS datasets
        datasets = []
        for ds_data in data.get('datasets', []):
            # Convert schema
            columns = []
            for col in ds_data.get('schema', {}).get('columns', []):
                columns.append(ColumnDefinition(
                    name=col['name'],
                    data_type=self._map_odcs_type(col['type']),
                    comment=col.get('description', ''),
                    nullable=col.get('nullable', True),
                    is_unique=col.get('unique', False)
                ))
            
            schema = DatasetSchema(
                columns=columns,
                primary_key=ds_data.get('schema', {}).get('primaryKey', []),
                version=ds_data.get('version', '1.0')
            )
            
            # Convert quality rules
            quality = Quality(
                rules=ds_data.get('quality', {}).get('rules', []),
                scores=ds_data.get('quality', {}).get('scores', {}),
                metrics=ds_data.get('quality', {}).get('metrics', {})
            )
            
            # Convert security
            security = Security(
                classification=self._map_odcs_classification(
                    ds_data.get('security', {}).get('classification', 'INTERNAL')
                ),
                pii_data=ds_data.get('security', {}).get('containsPII', False),
                compliance_labels=ds_data.get('security', {}).get('complianceLabels', [])
            )
            
            # Create dataset
            datasets.append(Dataset(
                name=ds_data['name'],
                type=ds_data.get('type', 'table'),
                schema=schema,
                metadata=metadata,
                quality=quality,
                security=security,
                lifecycle=DatasetLifecycle(),
                description=ds_data.get('description', '')
            ))
        
        # Create and return contract
        return self.create_contract(
            name=data['name'],
            version=data['version'],
            metadata=metadata,
            datasets=datasets,
            validation_rules=data.get('validationRules', []),
            effective_from=self._parse_odcs_date(data.get('effectiveFrom')),
            effective_until=self._parse_odcs_date(data.get('effectiveUntil')),
            terms_and_conditions=data.get('termsAndConditions', '')
        )

    def _map_odcs_type(self, odcs_type: str) -> DataType:
        """Map ODCS data types to internal types"""
        type_mapping = {
            'string': DataType.STRING,
            'integer': DataType.INTEGER,
            'number': DataType.DOUBLE,
            'boolean': DataType.BOOLEAN,
            'date': DataType.DATE,
            'timestamp': DataType.TIMESTAMP
        }
        return type_mapping.get(odcs_type.lower(), DataType.STRING)

    def _map_odcs_classification(self, classification: str) -> SecurityClassification:
        """Map ODCS security classifications"""
        class_mapping = {
            'public': SecurityClassification.PUBLIC,
            'internal': SecurityClassification.INTERNAL,
            'confidential': SecurityClassification.CONFIDENTIAL,
            'restricted': SecurityClassification.RESTRICTED
        }
        return class_mapping.get(classification.lower(), SecurityClassification.INTERNAL)

    def _parse_odcs_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse ODCS date format"""
        if not date_str:
            return None
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except ValueError:
            return None

    def to_odcs_format(self, contract: DataContract) -> Dict:
        """Convert a data contract to ODCS v3 format"""
        
        def map_type_to_odcs(data_type: DataType) -> str:
            """Reverse mapping of data types to ODCS format"""
            mapping = {
                DataType.STRING: 'string',
                DataType.INTEGER: 'integer',
                DataType.DOUBLE: 'number',
                DataType.BOOLEAN: 'boolean',
                DataType.DATE: 'date',
                DataType.TIMESTAMP: 'timestamp'
            }
            return mapping.get(data_type, 'string')
        
        def map_classification_to_odcs(classification: SecurityClassification) -> str:
            """Reverse mapping of security classifications to ODCS format"""
            mapping = {
                SecurityClassification.PUBLIC: 'public',
                SecurityClassification.INTERNAL: 'internal',
                SecurityClassification.CONFIDENTIAL: 'confidential',
                SecurityClassification.RESTRICTED: 'restricted'
            }
            return mapping.get(classification, 'internal')
        
        # Convert datasets
        datasets = []
        for ds in contract.datasets:
            # Convert columns to ODCS schema
            columns = []
            for col in ds.schema.columns:
                columns.append({
                    'name': col.name,
                    'type': map_type_to_odcs(col.data_type),
                    'description': col.comment,
                    'nullable': col.nullable,
                    'unique': col.is_unique,
                    'tags': col.tags
                })
            
            datasets.append({
                'name': ds.name,
                'type': ds.type,
                'description': ds.description,
                'schema': {
                    'columns': columns,
                    'primaryKey': ds.schema.primary_key,
                    'version': ds.schema.version
                },
                'quality': {
                    'rules': ds.quality.rules,
                    'scores': ds.quality.scores,
                    'metrics': ds.quality.metrics
                },
                'security': {
                    'classification': map_classification_to_odcs(ds.security.classification),
                    'containsPII': ds.security.pii_data,
                    'complianceLabels': ds.security.compliance_labels
                }
            })
        
        # Build ODCS contract
        return {
            'name': contract.name,
            'version': contract.version,
            'status': contract.status.value,
            'description': contract.metadata.business_description,
            'owner': contract.metadata.owner,
            'domain': contract.metadata.domain,
            'tags': contract.metadata.tags,
            'datasets': datasets,
            'validationRules': contract.validation_rules,
            'effectiveFrom': contract.effective_from.isoformat() + 'Z' if contract.effective_from else None,
            'effectiveUntil': contract.effective_until.isoformat() + 'Z' if contract.effective_until else None,
            'termsAndConditions': contract.terms_and_conditions,
            'created': contract.created_at.isoformat() + 'Z',
            'updated': contract.updated_at.isoformat() + 'Z'
        }
