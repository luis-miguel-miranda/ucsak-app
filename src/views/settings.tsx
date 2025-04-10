import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppSettings {
  id: string;
  name: string;
  value: any;
  enableBackgroundJobs: boolean;
  databricksHost: string;
  databricksToken: string;
  databricksWarehouseId: string;
  databricksCatalog: string;
  databricksSchema: string;
  gitRepoUrl: string;
  gitBranch: string;
  gitToken: string;
}

export default function Settings() {
  const { toast } = useToast();
  const { get, post } = useApi();
  const [settings, setSettings] = useState<AppSettings>({
    id: '',
    name: '',
    value: null,
    enableBackgroundJobs: false,
    databricksHost: '',
    databricksToken: '',
    databricksWarehouseId: '',
    databricksCatalog: '',
    databricksSchema: '',
    gitRepoUrl: '',
    gitBranch: '',
    gitToken: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await get<AppSettings>('/api/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await post('/api/settings', settings);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="databricks">Databricks</TabsTrigger>
          <TabsTrigger value="git">Git</TabsTrigger>
          <TabsTrigger value="jobs">Background Jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="background-jobs"
                  checked={settings.enableBackgroundJobs}
                  onCheckedChange={(checked) => setSettings({ ...settings, enableBackgroundJobs: checked })}
                />
                <Label htmlFor="background-jobs">Enable Background Jobs</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="databricks">
          <Card>
            <CardHeader>
              <CardTitle>Databricks Settings</CardTitle>
              <CardDescription>Configure Databricks connection settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={settings.databricksHost}
                  onChange={(e) => setSettings({ ...settings, databricksHost: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={settings.databricksToken}
                  onChange={(e) => setSettings({ ...settings, databricksToken: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse ID</Label>
                <Input
                  id="warehouse"
                  value={settings.databricksWarehouseId}
                  onChange={(e) => setSettings({ ...settings, databricksWarehouseId: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalog">Catalog</Label>
                <Input
                  id="catalog"
                  value={settings.databricksCatalog}
                  onChange={(e) => setSettings({ ...settings, databricksCatalog: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schema">Schema</Label>
                <Input
                  id="schema"
                  value={settings.databricksSchema}
                  onChange={(e) => setSettings({ ...settings, databricksSchema: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="git">
          <Card>
            <CardHeader>
              <CardTitle>Git Settings</CardTitle>
              <CardDescription>Configure Git repository for YAML storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="repo">Repository URL</Label>
                <Input
                  id="repo"
                  value={settings.gitRepoUrl}
                  onChange={(e) => setSettings({ ...settings, gitRepoUrl: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={settings.gitBranch}
                  onChange={(e) => setSettings({ ...settings, gitBranch: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="git-token">Token</Label>
                <Input
                  id="git-token"
                  type="password"
                  value={settings.gitToken}
                  onChange={(e) => setSettings({ ...settings, gitToken: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <CardTitle>Background Jobs</CardTitle>
              <CardDescription>Manage background jobs for data processing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Product Sync</h3>
                  <p className="text-sm text-muted-foreground">Sync data products with Unity Catalog</p>
                </div>
                <Button variant="outline">Install</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Data Contract Validation</h3>
                  <p className="text-sm text-muted-foreground">Validate data contracts and quality rules</p>
                </div>
                <Button variant="outline">Install</Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Business Glossary Sync</h3>
                  <p className="text-sm text-muted-foreground">Sync business glossary terms</p>
                </div>
                <Button variant="outline">Install</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
} 