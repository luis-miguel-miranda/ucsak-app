import os
import yaml
from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import jobs

@dataclass
class WorkflowInstallation:
    id: str
    name: str
    installed_at: datetime
    updated_at: datetime
    status: str
    workspace_id: str

class WorkflowManager:
    def __init__(self, workspace_client: WorkspaceClient, workflows_dir: str = "workflows"):
        self._client = workspace_client
        self._workflows_dir = workflows_dir
        self._installations: Dict[str, WorkflowInstallation] = {}

    def list_available_workflows(self) -> List[str]:
        """List all available workflow definitions from YAML files."""
        workflow_path = Path(self._workflows_dir)
        if not workflow_path.exists():
            return []
        
        return [f.stem for f in workflow_path.glob("*.yaml")]

    def list_installed_workflows(self) -> List[WorkflowInstallation]:
        """List all workflows installed in the Databricks workspace."""
        return list(self._installations.values())

    def install_workflow(self, workflow_name: str) -> WorkflowInstallation:
        """Install a workflow from YAML definition into Databricks workspace."""
        # Load workflow definition
        yaml_path = Path(self._workflows_dir) / f"{workflow_name}.yaml"
        if not yaml_path.exists():
            raise ValueError(f"Workflow definition not found: {workflow_name}")

        with open(yaml_path, 'r') as f:
            workflow_def = yaml.safe_load(f)

        # Create job in Databricks
        try:
            job_settings = jobs.JobSettings.from_dict(workflow_def)
            response = self._client.jobs.create(
                name=workflow_def.get('name', workflow_name),
                settings=job_settings
            )

            # Record installation
            installation = WorkflowInstallation(
                id=str(response.job_id),
                name=workflow_name,
                installed_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
                status="active",
                workspace_id=self._client.config.host
            )
            self._installations[workflow_name] = installation
            return installation

        except Exception as e:
            raise RuntimeError(f"Failed to install workflow: {str(e)}")

    def update_workflow(self, workflow_name: str) -> WorkflowInstallation:
        """Update an existing workflow in the Databricks workspace."""
        if workflow_name not in self._installations:
            raise ValueError(f"Workflow not installed: {workflow_name}")

        # Load updated workflow definition
        yaml_path = Path(self._workflows_dir) / f"{workflow_name}.yaml"
        if not yaml_path.exists():
            raise ValueError(f"Workflow definition not found: {workflow_name}")

        with open(yaml_path, 'r') as f:
            workflow_def = yaml.safe_load(f)

        # Update job in Databricks
        try:
            job_id = int(self._installations[workflow_name].id)
            job_settings = jobs.JobSettings.from_dict(workflow_def)
            self._client.jobs.update(
                job_id=job_id,
                new_settings=job_settings
            )

            # Update installation record
            self._installations[workflow_name].updated_at = datetime.utcnow()
            return self._installations[workflow_name]

        except Exception as e:
            raise RuntimeError(f"Failed to update workflow: {str(e)}")

    def remove_workflow(self, workflow_name: str) -> bool:
        """Remove a workflow from the Databricks workspace."""
        if workflow_name not in self._installations:
            return False

        try:
            job_id = int(self._installations[workflow_name].id)
            self._client.jobs.delete(job_id=job_id)
            del self._installations[workflow_name]
            return True

        except Exception as e:
            raise RuntimeError(f"Failed to remove workflow: {str(e)}") 