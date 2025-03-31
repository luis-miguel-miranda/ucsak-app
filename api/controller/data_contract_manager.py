import json
import logging
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

import yaml

from api.models.data_contract import DataContract

logger = logging.getLogger(__name__)

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


class DataContractManager:
    def __init__(self):
        self._contracts: Dict[str, DataContract] = {}

    def create_contract(self, name: str, contract_text: str, format: str, version: str,
                       owner: str, description: Optional[str] = None) -> DataContract:
        """Create a new contract"""
        # Validate format
        if not DataContract.validate_contract_text(contract_text, format):
            raise ValueError(f"Invalid {format} format")

        contract = DataContract(
            id=str(uuid.uuid4()),
            name=name,
            contract_text=contract_text,
            format=format.lower(),
            version=version,
            owner=owner,
            description=description
        )

        self._contracts[contract.id] = contract
        return contract

    def get_contract(self, contract_id: str) -> Optional[DataContract]:
        """Get a contract by ID"""
        return self._contracts.get(contract_id)

    def list_contracts(self) -> List[DataContract]:
        """List all contracts"""
        return list(self._contracts.values())

    def update_contract(self, contract_id: str, name: Optional[str] = None,
                       contract_text: Optional[str] = None, format: Optional[str] = None,
                       version: Optional[str] = None, owner: Optional[str] = None,
                       description: Optional[str] = None, status: Optional[str] = None) -> Optional[DataContract]:
        """Update an existing contract"""
        contract = self._contracts.get(contract_id)
        if not contract:
            return None

        if name is not None:
            contract.name = name
        if contract_text is not None:
            if format is not None:
                if not DataContract.validate_contract_text(contract_text, format):
                    raise ValueError(f"Invalid {format} format")
                contract.format = format.lower()
            contract.contract_text = contract_text
        if version is not None:
            contract.version = version
        if owner is not None:
            contract.owner = owner
        if description is not None:
            contract.description = description
        if status is not None:
            contract.status = status

        contract.updated_at = datetime.utcnow()
        return contract

    def delete_contract(self, contract_id: str) -> bool:
        """Delete a contract"""
        if contract_id in self._contracts:
            del self._contracts[contract_id]
            return True
        return False

    def save_to_yaml(self, file_path: str):
        """Save contracts to YAML file"""
        data = {
            'contracts': [
                {
                    'id': c.id,
                    'name': c.name,
                    'contract_text': c.contract_text,
                    'format': c.format,
                    'version': c.version,
                    'owner': c.owner,
                    'description': c.description,
                    'status': c.status,
                    'created_at': c.created_at.isoformat(),
                    'updated_at': c.updated_at.isoformat()
                }
                for c in self._contracts.values()
            ]
        }

        with open(file_path, 'w') as f:
            yaml.dump(data, f, sort_keys=False)

    def load_from_yaml(self, file_path: str):
        """Load contracts from YAML file"""
        with open(file_path) as f:
            data = yaml.safe_load(f)

        if not data or 'contracts' not in data:
            raise ValueError("Invalid YAML file format: missing 'contracts' key")

        self._contracts.clear()
        for c in data['contracts']:
            contract = DataContract(
                id=c['id'],
                name=c['name'],
                contract_text=c['contract_text'],
                format=c['format'],
                version=c['version'],
                owner=c['owner'],
                description=c.get('description'),
                status=c.get('status', 'draft'),
                created_at=datetime.fromisoformat(c['created_at']),
                updated_at=datetime.fromisoformat(c['updated_at'])
            )
            self._contracts[contract.id] = contract

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
            contract_text=json.dumps(data),
            format='json',
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
