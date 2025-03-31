import yaml
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
from databricks.sdk import WorkspaceClient
from databricks.sdk.service import jobs
from api.common.config import Settings
from api.models.settings import JobCluster, WorkflowInstallation

class SettingsManager:
    def __init__(self, workspace_client: WorkspaceClient):
        self._client = workspace_client
        self._settings = Settings()
        self._available_jobs = [
            'data_contracts',
            'business_glossaries',
            'entitlements',
            'mdm_jobs',
            'catalog_commander_jobs'
        ]
        self._installations: Dict[str, WorkflowInstallation] = {}

    def get_job_clusters(self) -> List[JobCluster]:
        """Get available job clusters"""
        clusters = self._client.clusters.list()
        return [
            JobCluster(
                id=cluster.cluster_id,
                name=cluster.cluster_name,
                node_type_id=cluster.node_type_id,
                autoscale=bool(cluster.autoscale),
                min_workers=cluster.autoscale.min_workers if cluster.autoscale else cluster.num_workers,
                max_workers=cluster.autoscale.max_workers if cluster.autoscale else cluster.num_workers
            )
            for cluster in clusters
        ]

    def get_settings(self) -> dict:
        """Get current settings"""
        return {
            'job_clusters': self.get_job_clusters(),
            'current_settings': self._settings.to_dict(),
            'available_jobs': self._available_jobs
        }

    def update_settings(self, settings: dict) -> Settings:
        """Update settings"""
        self._settings.job_cluster_id = settings.get('job_cluster_id')
        self._settings.sync_enabled = settings.get('sync_enabled', False)
        self._settings.sync_repository = settings.get('sync_repository')
        self._settings.enabled_jobs = settings.get('enabled_jobs', [])
        self._settings.updated_at = datetime.utcnow()
        return self._settings

    def list_available_workflows(self) -> List[str]:
        """List all available workflow definitions from YAML files."""
        workflow_path = Path("workflows")
        if not workflow_path.exists():
            return []
        
        return [f.stem for f in workflow_path.glob("*.yaml")]

    def list_installed_workflows(self) -> List[WorkflowInstallation]:
        """List all workflows installed in the Databricks workspace."""
        return list(self._installations.values())

    def install_workflow(self, workflow_name: str) -> WorkflowInstallation:
        """Install a workflow from YAML definition into Databricks workspace."""
        # Load workflow definition
        yaml_path = Path("workflows") / f"{workflow_name}.yaml"
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
        yaml_path = Path("workflows") / f"{workflow_name}.yaml"
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

    def install_job(self, job_id: str) -> dict:
        """Install and enable a background job"""
        if job_id not in self._available_jobs:
            raise ValueError(f"Job {job_id} not found")

        try:
            # Update settings to enable the job
            if not self._settings.enabled_jobs:
                self._settings.enabled_jobs = []
            self._settings.enabled_jobs.append(job_id)
            self._settings.updated_at = datetime.utcnow()

            # Install the job in Databricks
            workflow_def = self._get_workflow_definition(job_id)
            job_settings = jobs.JobSettings.from_dict(workflow_def)
            response = self._client.jobs.create(
                name=workflow_def.get('name', job_id),
                settings=job_settings
            )

            return {
                'id': str(response.job_id),
                'name': job_id,
                'installed_at': self._settings.updated_at.isoformat(),
                'status': 'active',
                'workspace_id': self._client.config.host
            }
        except Exception as e:
            # Remove from enabled jobs if installation fails
            if job_id in self._settings.enabled_jobs:
                self._settings.enabled_jobs.remove(job_id)
            raise RuntimeError(f"Failed to install job: {str(e)}")

    def update_job(self, job_id: str, enabled: bool) -> dict:
        """Enable or disable a background job"""
        if job_id not in self._available_jobs:
            raise ValueError(f"Job {job_id} not found")

        try:
            if enabled and job_id not in (self._settings.enabled_jobs or []):
                return self.install_job(job_id)
            elif not enabled and job_id in (self._settings.enabled_jobs or []):
                return self.remove_job(job_id)
            
            return {
                'name': job_id,
                'status': 'active' if enabled else 'disabled',
                'updated_at': datetime.utcnow().isoformat()
            }
        except Exception as e:
            raise RuntimeError(f"Failed to update job: {str(e)}")

    def remove_job(self, job_id: str) -> bool:
        """Remove and disable a background job"""
        if job_id not in self._available_jobs:
            raise ValueError(f"Job {job_id} not found")

        try:
            # Remove from enabled jobs
            if job_id in (self._settings.enabled_jobs or []):
                self._settings.enabled_jobs.remove(job_id)
                self._settings.updated_at = datetime.utcnow()

            # Remove job from Databricks
            job = self._find_job_by_name(job_id)
            if job:
                self._client.jobs.delete(job_id=job.job_id)
            return True
        except Exception as e:
            raise RuntimeError(f"Failed to remove job: {str(e)}")

    def _get_workflow_definition(self, job_id: str) -> dict:
        """Get the workflow definition for a job"""
        # Implementation depends on how you store job definitions
        # Could be from YAML files, database, etc.
        pass

    def _find_job_by_name(self, job_name: str) -> Optional[jobs.Job]:
        """Find a job in Databricks by name"""
        all_jobs = self._client.jobs.list()
        return next((job for job in all_jobs if job.settings.name == job_name), None) 