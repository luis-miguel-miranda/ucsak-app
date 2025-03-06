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
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  ListItemSecondaryAction,
  ListSubheader,
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

function SettingsView() {
  const [options, setOptions] = useState<SettingOption[]>([
    {
      id: 'mdm_jobs',
      name: 'Master Data Management Jobs',
      description: 'Install and enable the Master Data Management background jobs',
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
        setOptions(prevOptions => 
          prevOptions.map(option => {
            const settingValue = data[option.id];
            return {
              ...option,
              enabled: settingValue === true,
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

  const handleToggle = (id: string) => {
    // Find the option and get its current state
    const option = options.find(opt => opt.id === id);
    if (!option) return;
    
    const newEnabled = !option.enabled;
    
    // Update UI to show loading state
    setOptions(prevOptions => 
      prevOptions.map(opt => 
        opt.id === id ? { ...opt, loading: true } : opt
      )
    );
    
    // Make API call to update the setting
    fetch(`/api/settings/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ enabled: newEnabled }),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to update ${id} setting`);
        }
        return response.json();
      })
      .then(data => {
        // Update the state with the response
        setOptions(prevOptions => 
          prevOptions.map(opt => 
            opt.id === id ? { ...opt, enabled: newEnabled, loading: false } : opt
          )
        );
        
        // Show success message
        setSnackbar({
          open: true,
          message: `${option.name} ${newEnabled ? 'enabled' : 'disabled'} successfully`,
          severity: 'success',
        });
      })
      .catch(err => {
        console.error(`Error updating ${id} setting:`, err);
        
        // Revert the option state and show error
        setOptions(prevOptions => 
          prevOptions.map(opt => 
            opt.id === id ? { ...opt, loading: false } : opt
          )
        );
        
        setSnackbar({
          open: true,
          message: `Failed to ${newEnabled ? 'enable' : 'disable'} ${option.name}`,
          severity: 'error',
        });
      });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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
                        onChange={() => handleToggle(option.id)}
                      />
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        </Paper>
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