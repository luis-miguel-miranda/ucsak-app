from typing import List, Optional

import yaml

from ..models.compliance import CompliancePolicy


class ComplianceManager:
    def __init__(self):
        self.policies: List[CompliancePolicy] = []

    def load_from_yaml(self, yaml_path: str) -> None:
        """Load compliance policies from a YAML file"""
        with open(yaml_path) as f:
            data = yaml.safe_load(f)
            for policy in data:
                self.create_policy(CompliancePolicy(**policy))

    def get_policies(self) -> List[CompliancePolicy]:
        """Get all compliance policies"""
        return self.policies

    def get_policy(self, policy_id: str) -> Optional[CompliancePolicy]:
        """Get a specific policy by ID"""
        return next((p for p in self.policies if p.id == policy_id), None)

    def create_policy(self, policy: CompliancePolicy) -> CompliancePolicy:
        """Create a new compliance policy"""
        self.policies.append(policy)
        return policy

    def update_policy(self, policy_id: str, policy: CompliancePolicy) -> Optional[CompliancePolicy]:
        """Update an existing policy"""
        for i, p in enumerate(self.policies):
            if p.id == policy_id:
                self.policies[i] = policy
                return policy
        return None

    def delete_policy(self, policy_id: str) -> bool:
        """Delete a policy"""
        initial_length = len(self.policies)
        self.policies = [p for p in self.policies if p.id != policy_id]
        return len(self.policies) < initial_length

    def get_compliance_stats(self):
        """Get compliance statistics"""
        active_policies = [p for p in self.policies if p.is_active]
        critical_issues = [p for p in active_policies if p.severity == "critical" and p.compliance < 70]

        return {
            "overall_compliance": sum(p.compliance for p in active_policies) / len(active_policies) if active_policies else 0,
            "active_policies": len(active_policies),
            "critical_issues": len(critical_issues)
        }
