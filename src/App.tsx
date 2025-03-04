import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Tabs,
  Tab,
  Box,
  AppBar,
  CssBaseline,
  Divider,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';
import CommandIcon from '@mui/icons-material/Code';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HelpIcon from '@mui/icons-material/Help';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import HomeIcon from '@mui/icons-material/Home';
import DataContractsView from './views/DataContractsView';
import DataProductsView from './views/DataProductsView';
import CatalogCommanderView from './views/CatalogCommanderView';
import AboutView from './views/AboutView';
import BusinessGlossariesView from './views/BusinessGlossariesView';
import MasterDataManagementView from './views/MasterDataManagementView';

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [summaryData, setSummaryData] = useState({
    totalDataProducts: 0,
    totalDataContracts: 0,
    activeWorkflows: 23,
  });

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [productsRes, contractsRes] = await Promise.all([
          fetch('/api/data-products'),
          fetch('/api/contracts')
        ]);

        if (!productsRes.ok) throw new Error('Failed to fetch data products');
        if (!contractsRes.ok) throw new Error('Failed to fetch data contracts');

        const products = await productsRes.json();
        const contracts = await contractsRes.json();

        setSummaryData(prev => ({
          ...prev,
          totalDataProducts: products.length,
          totalDataContracts: contracts.length
        }));
      } catch (error) {
        console.error('Error fetching counts:', error);
      }
    };

    fetchCounts();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderHomePage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        Welcome to the Unity Catalog Swiss Army Knife
      </Typography>
      <Typography variant="h6" gutterBottom align="center" color="text.secondary" sx={{ mb: 6 }}>
        Your all-in-one tool for managing Databricks Unity Catalog resources
      </Typography>

      <Grid container spacing={4}>
        {/* Summary Tiles - First Row */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Data Products</Typography>
              <Typography variant="h3">{summaryData.totalDataProducts}</Typography>
              <Typography color="text.secondary">Total Data Products</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Data Contracts</Typography>
              <Typography variant="h3">{summaryData.totalDataContracts}</Typography>
              <Typography color="text.secondary">Active Contracts</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom>Active Workflows</Typography>
              <Typography variant="h3">{summaryData.activeWorkflows}</Typography>
              <Typography color="text.secondary">Running Processes</Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Divider */}
        <Grid item xs={12}>
          <Divider sx={{ my: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Quick Navigation
            </Typography>
          </Divider>
        </Grid>

        {/* Navigation Tiles - Second Row */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(1)}>
              <CardContent>
                <StorageIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Data Products</Typography>
                <Typography color="text.secondary">
                  Manage and monitor your data products
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(2)}>
              <CardContent>
                <DescriptionIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Data Contracts</Typography>
                <Typography color="text.secondary">
                  Create and manage data contracts
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(3)}>
              <CardContent>
                <MenuBookIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Business Glossaries</Typography>
                <Typography color="text.secondary">
                  Manage business terms and definitions
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Additional Navigation Tiles - Third Row */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(4)}>
              <CardContent>
                <CompareArrowsIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Master Data Management</Typography>
                <Typography color="text.secondary">
                  Analyze and manage entity overlaps
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(5)}>
              <CardContent>
                <CommandIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Catalog Commander</Typography>
                <Typography color="text.secondary">
                  Advanced catalog management tools
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardActionArea onClick={() => setSelectedTab(6)}>
              <CardContent>
                <HelpIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>About</Typography>
                <Typography color="text.secondary">
                  Learn more about this application
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ bgcolor: 'white' }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab icon={<HomeIcon />} iconPosition="start" label="Home" />
          <Tab icon={<StorageIcon />} iconPosition="start" label="Data Products" />
          <Tab icon={<DescriptionIcon />} iconPosition="start" label="Data Contracts" />
          <Tab icon={<MenuBookIcon />} iconPosition="start" label="Business Glossaries" />
          <Tab icon={<CompareArrowsIcon />} iconPosition="start" label="Master Data Management" />
          <Tab icon={<CommandIcon />} iconPosition="start" label="Catalog Commander" />
          <Tab icon={<HelpIcon />} iconPosition="start" label="About" />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {selectedTab === 0 && renderHomePage()}
        {selectedTab === 1 && <DataProductsView />}
        {selectedTab === 2 && <DataContractsView />}
        {selectedTab === 3 && <BusinessGlossariesView />}
        {selectedTab === 4 && <MasterDataManagementView />}
        {selectedTab === 5 && <CatalogCommanderView />}
        {selectedTab === 6 && <AboutView />}
      </Box>
    </Box>
  );
}

export default App;
