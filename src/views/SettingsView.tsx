import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Switch,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  ListItemSecondaryAction,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormControlLabel,
  TextField,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import PageHeader from '../components/PageHeader';

interface SettingOption {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  loading: boolean;
}

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

function SettingsView() {
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
  ]);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch current settings
  useEffect(() => {
    fetch('/api/settings')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        return response.json();
      })
      .then(data => {
        setJobClusters(data.job_clusters);
        setSettings(data.current_settings);
        setOptions(prevOptions => 
          prevOptions.map(option => {
            const settingValue = data.current_settings.enabled_jobs.includes(option.id);
            return {
              ...option,
              enabled: settingValue,
              loading: false,
            };
          })
        );
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again later.');
        setIsLoading(false);
      });
  }, []);

  // Add this effect to fetch job clusters
  useEffect(() => {
    fetch('/api/settings/job-clusters')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch job clusters');
        }
        return response.json();
      })
      .then(data => {
        setJobClusters(data);
      })
      .catch(err => {
        console.error('Error fetching job clusters:', err);
        setError('Failed to load job clusters. Please try again later.');
      });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSettingChange = (key: keyof Settings, value: any) => {
    // Special handling for enabled_jobs
    if (key === 'enabled_jobs') {
      const jobId = value; // In this case, value is the job ID to toggle
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

    // Debounce the API call to avoid too many requests
    const debouncedSave = setTimeout(() => {
      fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          [key]: value,
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to update settings');
          }
          return response.json();
        })
        .then(data => {
          // Update state with server response
          setSettings(data);
          
          // Update options state if this was a job toggle
          if (key === 'enabled_jobs') {
            setOptions(prevOptions => 
              prevOptions.map(opt => ({
                ...opt,
                enabled: data.enabled_jobs?.includes(opt.id) || false,
                loading: false
              }))
            );
          }

          // Show appropriate success message
          setSnackbar({
            open: true,
            message: key === 'enabled_jobs'
              ? `${options.find(opt => opt.id === value)?.name} ${value ? 'enabled' : 'disabled'} successfully`
              : 'Settings updated successfully',
            severity: 'success',
          });
        })
        .catch(err => {
          console.error('Error updating settings:', err);
          
          // Revert states on error
          if (key === 'enabled_jobs') {
            setOptions(prevOptions => 
              prevOptions.map(opt => 
                opt.id === value ? { ...opt, loading: false } : opt
              )
            );
          }
          setSettings(prevSettings => ({
            ...prevSettings,
            [key]: prevSettings[key],
          }));
          
          setSnackbar({
            open: true,
            message: key === 'enabled_jobs'
              ? `Failed to ${value ? 'enable' : 'disable'} ${options.find(opt => opt.id === value)?.name}`
              : 'Failed to update settings',
            severity: 'error',
          });
        });
    }, 500);

    return () => clearTimeout(debouncedSave);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Settings"
        subtitle="Configure application settings and background jobs"
        icon={<SettingsIcon fontSize="large" />}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure general application settings and infrastructure preferences.
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Job Cluster Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Select the Databricks cluster to use for running background jobs.
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Job Cluster</InputLabel>
                <Select
                  value={settings.job_cluster_id || ''}
                  onChange={(e) => handleSettingChange('job_cluster_id', e.target.value)}
                  label="Job Cluster"
                >
                  {jobClusters.length === 0 ? (
                    <MenuItem disabled>
                      No job clusters available. Please create a cluster in Databricks first.
                    </MenuItem>
                  ) : (
                    jobClusters.map(cluster => (
                      <MenuItem key={cluster.id} value={cluster.id}>
                        {cluster.name} ({cluster.node_type_id})
                        {cluster.autoscale && ` [${cluster.min_workers}-${cluster.max_workers} workers]`}
                      </MenuItem>
                    ))
                  )}
                </Select>
                <FormHelperText>
                  {jobClusters.length === 0 
                    ? "No clusters found - create a cluster in Databricks to proceed"
                    : "Select the cluster to run background jobs"
                  }
                </FormHelperText>
              </FormControl>
            </Box>

            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Repository Synchronization
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Configure synchronization with an external Git repository.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sync_enabled}
                    onChange={(e) => handleSettingChange('sync_enabled', e.target.checked)}
                  />
                }
                label="Enable Repository Sync"
              />
              
              <TextField
                fullWidth
                label="Repository URL"
                value={settings.sync_repository || ''}
                onChange={(e) => handleSettingChange('sync_repository', e.target.value)}
                disabled={!settings.sync_enabled}
                sx={{ mt: 2 }}
                helperText="Repository URL to sync changes"
              />
            </Box>
          </Paper>
          
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Background Jobs
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enable or disable background jobs that run in your Databricks workspace.
            </Typography>
            
            <List>
              {options.map((option) => (
                <React.Fragment key={option.id}>
                  <ListItem>
                    <ListItemText 
                      primary={option.name} 
                      secondary={option.description} 
                    />
                    <ListItemSecondaryAction>
                      {option.loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        <Switch
                          edge="end"
                          checked={option.enabled}
                          onChange={() => handleSettingChange('enabled_jobs', option.id)}
                        />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default SettingsView; 