import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { Loader2, Settings as SettingsIcon, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';

interface JobCluster {
  id: string;
  name: string;
  node_type_id: string;
  autoscale: boolean;
  min_workers: number;
  max_workers: number;
}

interface Settings {
  job_cluster_id: string | null;
  sync_enabled: boolean;
  sync_repository: string | null;
  enabled_jobs: string[];
}

interface SettingOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const [jobClusters, setJobClusters] = useState<JobCluster[]>([]);
  const [settings, setSettings] = useState<Settings>({
    job_cluster_id: null,
    sync_enabled: false,
    sync_repository: null,
    enabled_jobs: []
  });
  
  const [options, setOptions] = useState<SettingOption[]>([
    {
      id: 'data_contracts',
      name: 'Data Contracts Jobs',
      description: 'Install and enable the Data Contracts background jobs',
      enabled: false,
      loading: true,
    },
    {
      id: 'business_glossaries',
      name: 'Business Glossaries Jobs',
      description: 'Install and enable the Business Glossaries background jobs',
      enabled: false,
      loading: true,
    },
    {
      id: 'mdm_jobs',
      name: 'Master Data Management Jobs',
      description: 'Install and enable the Master Data Management background jobs',
      enabled: false,
      loading: true,
    },
    {
      id: 'entitlements',
      name: 'Entitlements Jobs',
      description: 'Install and enable the Entitlements background jobs',
      enabled: false,
      loading: true,
    },
    {
      id: 'catalog_commander_jobs',
      name: 'Catalog Commander Jobs',
      description: 'Install and enable the Catalog Commander background jobs',
      enabled: false,
      loading: true,
    },
    {
      id: 'compliance_checker',
      name: 'Compliance Checker',
      description: 'Run automated compliance checks against defined policies',
      enabled: false,
      loading: true,
    },
  ]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings and job clusters
  useEffect(() => {
    Promise.all([
      fetch('/api/settings').then(res => res.json()),
      fetch('/api/settings/job-clusters').then(res => res.json())
    ])
      .then(([settingsData, clustersData]) => {
        setJobClusters(clustersData);
        setSettings({
          ...settingsData,
          enabled_jobs: settingsData.enabled_jobs || []
        });
        setOptions(prevOptions => 
          prevOptions.map(option => ({
            ...option,
            enabled: (settingsData.enabled_jobs || []).includes(option.id),
            loading: false,
          }))
        );
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
        setIsLoading(false);
      });
  }, []);

  const handleSettingChange = (key: keyof Settings, value: any) => {
    // Special handling for enabled_jobs
    if (key === 'enabled_jobs') {
      const jobId = value;
      const option = options.find(opt => opt.id === jobId);
      if (!option) return;

      const newEnabled = !option.enabled;
      
      // Update UI to show loading state for the specific job
      setOptions(prevOptions => 
        prevOptions.map(opt => 
          opt.id === jobId ? { ...opt, loading: true } : opt
        )
      );

      value = newEnabled 
        ? [...(settings.enabled_jobs || []), jobId]
        : settings.enabled_jobs?.filter(j => j !== jobId) || [];
    }

    // Update local state immediately for responsive UI
    setSettings(prevSettings => ({
      ...prevSettings,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      setSettings(data);
      
      setOptions(prevOptions => 
        prevOptions.map(opt => ({
          ...opt,
          enabled: data.enabled_jobs?.includes(opt.id) || false,
        }))
      );

      toast({
        title: 'Settings updated',
        description: 'Your changes have been saved successfully.',
      });
    } catch (err) {
      console.error('Error updating settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to update settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-6">
        <div className="bg-destructive/15 text-destructive p-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="w-8 h-8" />
        Settings
      </h1>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and set e-mail preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
              <TabsTrigger value="git">Git Integration</TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your general application settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="job-cluster">Job Cluster</Label>
                      <Select
                        value={settings.job_cluster_id || 'no-clusters'}
                        onValueChange={(value) => handleSettingChange('job_cluster_id', value === 'no-clusters' ? null : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job cluster" />
                        </SelectTrigger>
                        <SelectContent>
                          {jobClusters.length === 0 ? (
                            <SelectItem value="no-clusters" disabled>
                              No job clusters available. Please create a cluster in Databricks first.
                            </SelectItem>
                          ) : (
                            jobClusters.map(cluster => (
                              <SelectItem key={cluster.id} value={cluster.id}>
                                {cluster.name} ({cluster.node_type_id})
                                {cluster.autoscale && ` [${cluster.min_workers}-${cluster.max_workers} workers]`}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Background Jobs</CardTitle>
                  <CardDescription>
                    Enable or disable background jobs for different features.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {options.map((option) => (
                    <div key={option.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor={option.id}>{option.name}</Label>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <Switch
                        id={option.id}
                        checked={option.enabled}
                        onCheckedChange={() => handleSettingChange('enabled_jobs', option.id)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="git">
              <Card>
                <CardHeader>
                  <CardTitle>Git Integration</CardTitle>
                  <CardDescription>
                    Configure Git repository synchronization settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="sync-enabled">Repository Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Enable synchronization with external Git repository
                        </p>
                      </div>
                      <Switch
                        id="sync-enabled"
                        checked={settings.sync_enabled}
                        onCheckedChange={(checked) => handleSettingChange('sync_enabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="repository-url">Repository URL</Label>
                      <Input
                        id="repository-url"
                        placeholder="https://github.com/username/repo.git"
                        value={settings.sync_repository || ''}
                        onChange={(e) => handleSettingChange('sync_repository', e.target.value)}
                        disabled={!settings.sync_enabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 