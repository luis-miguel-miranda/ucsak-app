import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Divider,
  CircularProgress,
  Paper,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GavelIcon from '@mui/icons-material/Gavel';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SearchBar from '../components/SearchBar';


function HomeView() {
  const [stats, setStats] = useState({
    dataContracts: { count: 0, loading: true, error: null },
    dataProducts: { count: 0, loading: true, error: null },
    glossaries: { count: { glossaries: 0, terms: 0 }, loading: true, error: null },
    personas: { count: 0, loading: true, error: null },
  });

  useEffect(() => {
    // Fetch data products count
    fetch('/api/data-products')
      .then(response => response.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          dataProducts: { count: data.length, loading: false, error: null }
        }));
      })
      .catch(error => {
        console.error('Error fetching data products:', error);
        setStats(prev => ({
          ...prev,
          dataProducts: { count: 0, loading: false, error: error.message }
        }));
      });

    // Fetch data contracts count
    fetch('/api/data-contracts')
      .then(response => response.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          dataContracts: { count: data.length, loading: false, error: null }
        }));
      })
      .catch(error => {
        console.error('Error fetching data contracts:', error);
        setStats(prev => ({
          ...prev,
          dataContracts: { count: 0, loading: false, error: error.message }
        }));
      });

    // Fetch glossaries count
    fetch('/api/business-glossaries/counts')
      .then(response => response.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          glossaries: { count: { glossaries: data.glossaries, terms: data.terms }, loading: false, error: null }
        }));
      })
      .catch(error => {
        console.error('Error fetching glossaries:', error);
        setStats(prev => ({
          ...prev,
          glossaries: { count: { glossaries: 0, terms: 0 }, loading: false, error: error.message }
        }));
      });

    // Fetch personas count
    fetch('/api/entitlements/personas')
      .then(response => response.json())
      .then(data => {
        setStats(prev => ({
          ...prev,
          personas: { count: data.length, loading: false, error: null }
        }));
      })
      .catch(error => {
        console.error('Error fetching personas:', error);
        setStats(prev => ({
          ...prev,
          personas: { count: 0, loading: false, error: error.message }
        }));
      });
  }, []);

  const features = [
    {
      title: 'Data Products',
      description: 'Define and catalog your data products',
      icon: <CategoryIcon sx={{ fontSize: 40 }} />,
      link: '/data-products',
    },
    {
      title: 'Data Contracts',
      description: 'Create and manage data contracts between producers and consumers',
      icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
      link: '/data-contracts',
    },
    {
      title: 'Business Glossary',
      description: 'Manage business glossaries and data domains',
      icon: <MenuBookIcon sx={{ fontSize: 40 }} />,
      link: '/business-glossary',
    },
    {
      title: 'Master Data Management',
      description: 'Manage master data and reference data',
      icon: <CompareArrowsIcon sx={{ fontSize: 40 }} />,
      link: '/master-data',
    },
    {
      title: 'Entitlements',
      description: 'Manage access control personas and privileges',
      icon: <ManageAccountsIcon sx={{ fontSize: 40 }} />,
      link: '/entitlements',
    },
    {
      title: 'Security',
      description: 'Manage advanced security features for your data',
      icon: <SecurityIcon />,
      link: '/security'
    },
    {
      title: 'Compliance',
      description: 'Monitor and manage compliance policies',
      icon: <GavelIcon />,
      link: '/compliance'
    },
    {
      title: 'Catalog Commander',
      description: 'Explore and manage your data catalog',
      icon: <Inventory2OutlinedIcon sx={{ fontSize: 40 }} />,
      link: '/catalog-commander',
    },
    {
      title: 'Settings',
      description: 'Configure application settings and background jobs',
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      link: '/settings',
    },
    {
      title: 'About',
      description: 'Learn more about this application',
      icon: <InfoIcon sx={{ fontSize: 40 }} />,
      link: '/about',
    },
  ];

  const summaryTiles = [
    {
      title: ['Data Products'],
      value: [stats.dataProducts.count],
      loading: stats.dataProducts.loading,
      error: stats.dataProducts.error,
      link: '/data-products',
    },
    {
      title: ['Data Contracts'],
      value: [stats.dataContracts.count],
      loading: stats.dataContracts.loading,
      error: stats.dataContracts.error,
      link: '/data-contracts',
    },
    {
      title: ['Glossaries', 'Terms'],
      value: [stats.glossaries.count.glossaries, stats.glossaries.count.terms],
      loading: stats.glossaries.loading,
      error: stats.glossaries.error,
      link: '/business-glossary',
    },
    {
      title: ['Personas'],
      value: [stats.personas.count],
      loading: stats.personas.loading,
      error: stats.personas.error,
      link: '/entitlements',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the Unity Catalog Swiss Army Knife
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your data assets, contracts, and governance processes in one place.
        </Typography>
      </Box>

      <Container maxWidth="md" sx={{ mt: 8, mb: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Unity Catalog Swiss Army Knife
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
          Search across data products, business terms, data contracts and more
        </Typography>
        <Box sx={{ mt: 4, mb: 6 }}>
          <SearchBar 
            variant="large" 
            placeholder="Search for data products, business terms, contracts..." 
          />
        </Box>
      </Container>

      {/* Summary Tiles */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Overview
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summaryTiles.map((tile) => (
          <Grid item xs={12} sm={6} md={3} key={tile.title[0]}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#f5f5f5',
                '&:hover': {
                  backgroundColor: '#e0e0e0',
                }
              }}
              component={Link}
              to={tile.link}
              style={{ textDecoration: 'none' }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                {tile.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress size={40} />
                  </Box>
                ) : tile.error ? (
                  <Typography color="error" sx={{ mt: 2 }}>
                    Error loading data
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    {tile.title.map((title, index) => (
                      <React.Fragment key={title}>
                        {index > 0 && (
                          <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
                        )}
                        <Box>
                          <Typography variant="h6" component="div" color="text.secondary">
                            {title}
                          </Typography>
                          <Typography variant="h3" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
                            {tile.value[index]}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Feature Tiles */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Features
      </Typography>
      <Grid container spacing={4}>
        {features.map((feature) => (
          <Grid item xs={12} sm={6} md={4} key={feature.title}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  {feature.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h2" align="center">
                  {feature.title}
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary" align="center">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  component={Link}
                  to={feature.link}
                  size="small"
                  fullWidth
                  variant="contained"
                >
                  Explore
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default HomeView; 