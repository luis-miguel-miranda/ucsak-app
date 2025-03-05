import uuid
import yaml
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
from models.business_glossary import Domain, GlossaryTerm

class BusinessGlossaryManager:
    def __init__(self):
        self._terms: Dict[str, GlossaryTerm] = {}
        self._domains: Dict[str, Domain] = {}
        
    def create_term(self, 
                   name: str,
                   definition: str,
                   domain: str,
                   owner: str,
                   synonyms: List[str] = None,
                   related_terms: List[str] = None,
                   tags: List[str] = None,
                   examples: List[str] = None,
                   source: str = None,
                   taggedAssets: List[Dict[str, Any]] = None) -> GlossaryTerm:
        """Create a new glossary term"""
        term_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        term = GlossaryTerm(
            id=term_id,
            name=name,
            definition=definition,
            domain=domain,
            owner=owner,
            status="active",
            created=now,
            updated=now,
            synonyms=synonyms or [],
            related_terms=related_terms or [],
            tags=tags or [],
            examples=examples or [],
            source=source,
            taggedAssets=taggedAssets or []
        )
        
        self._terms[term_id] = term
        return term
    
    def get_term(self, term_id: str) -> Optional[GlossaryTerm]:
        """Get a glossary term by ID"""
        return self._terms.get(term_id)
    
    def list_terms(self) -> List[GlossaryTerm]:
        """List all glossary terms"""
        return list(self._terms.values())
    
    def update_term(self, term_id: str, **kwargs) -> Optional[GlossaryTerm]:
        """Update a glossary term"""
        term = self._terms.get(term_id)
        if not term:
            return None
            
        for key, value in kwargs.items():
            if hasattr(term, key):
                setattr(term, key, value)
                
        term.updated = datetime.utcnow()
        return term
    
    def delete_term(self, term_id: str) -> bool:
        """Delete a glossary term"""
        if term_id in self._terms:
            del self._terms[term_id]
            return True
        return False
    
    def search_terms(self, query: str) -> List[GlossaryTerm]:
        """Search for glossary terms"""
        query = query.lower()
        results = []
        
        for term in self._terms.values():
            if (query in term.name.lower() or 
                query in term.definition.lower() or
                any(query in syn.lower() for syn in term.synonyms)):
                results.append(term)
                
        return results
    
    # Domain methods
    def create_domain(self, id: str, name: str, description: str = None) -> Domain:
        """Create a new domain"""
        domain = Domain(
            id=id,
            name=name,
            description=description
        )
        self._domains[id] = domain
        return domain
    
    def get_domain(self, domain_id: str) -> Optional[Domain]:
        """Get a domain by ID"""
        return self._domains.get(domain_id)
    
    def list_domains(self) -> List[Domain]:
        """List all domains"""
        return list(self._domains.values())
    
    def update_domain(self, domain_id: str, **kwargs) -> Optional[Domain]:
        """Update a domain"""
        domain = self._domains.get(domain_id)
        if not domain:
            return None
            
        for key, value in kwargs.items():
            if hasattr(domain, key):
                setattr(domain, key, value)
                
        return domain
    
    def delete_domain(self, domain_id: str) -> bool:
        """Delete a domain"""
        if domain_id in self._domains:
            del self._domains[domain_id]
            return True
        return False
    
    def load_from_yaml(self, yaml_path: str) -> bool:
        """Load glossary terms and domains from a YAML file"""
        try:
            with open(yaml_path, 'r') as file:
                data = yaml.safe_load(file)
                
            # Load domains
            for domain_data in data.get('domains', []):
                domain = Domain(
                    id=domain_data.get('id', ''),
                    name=domain_data.get('name', ''),
                    description=domain_data.get('description')
                )
                self._domains[domain.id] = domain
                
            # Load terms
            for term_data in data.get('terms', []):
                # Parse dates
                created = datetime.fromisoformat(term_data.get('created', '').replace('Z', '+00:00'))
                updated = datetime.fromisoformat(term_data.get('updated', '').replace('Z', '+00:00'))
                
                # Create term
                term = GlossaryTerm(
                    id=term_data.get('id', str(uuid.uuid4())),
                    name=term_data.get('name', ''),
                    definition=term_data.get('definition', ''),
                    domain=term_data.get('domain', ''),
                    owner=term_data.get('owner', ''),
                    status=term_data.get('status', 'active'),
                    created=created,
                    updated=updated,
                    synonyms=term_data.get('synonyms', []),
                    related_terms=term_data.get('related_terms', []),
                    tags=term_data.get('tags', []),
                    examples=term_data.get('examples', []),
                    source=term_data.get('source'),
                    taggedAssets=term_data.get('taggedAssets', [])
                )
                
                self._terms[term.id] = term
                
            return True
        except Exception as e:
            print(f"Error loading glossary terms from YAML: {e}")
            return False 