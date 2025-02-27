import React, { useState } from 'react';
import {
  Container,
  Paper,
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
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import DescriptionIcon from '@mui/icons-material/Description';
import CommandIcon from '@mui/icons-material/Code';
import InfoIcon from '@mui/icons-material/Info';
import DataContractsView from './views/DataContractsView';
import DataProductsView from './views/DataProductsView';
import CatalogCommanderView from './views/CatalogCommanderView';
import AboutView from './views/AboutView';
import BusinessGlossariesView from './views/BusinessGlossariesView';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [summaryData, setSummaryData] = useState({
    totalDataProducts: 42,
    totalContracts: 156,
    activeWorkflows: 23,
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const renderHomePage = () => (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h3" gutterBottom align="center">
        Welcome to Unity Catalog Swiss Army Knife
      </Typography>
      <Typography variant="h6" gutterBottom align="center" color="text.secondary" sx={{ mb: 6 }}>
        Your all-in-one tool for managing Databricks Unity Catalog resources
      </Typography>

      <Grid container spacing={4}>
        {/* Summary Tiles */}
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
              <Typography variant="h3">{summaryData.totalContracts}</Typography>
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

        {/* Navigation Tiles */}
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
                <CommandIcon sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h5" gutterBottom>Catalog Commander</Typography>
                <Typography color="text.secondary">
                  Advanced catalog management tools
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
          <Tab label="Home" />
          <Tab label="Data Products" />
          <Tab label="Data Contracts" />
          <Tab label="Business Glossaries" />
          <Tab label="Catalog Commander" />
          <Tab label="About" />
        </Tabs>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {selectedTab === 0 && renderHomePage()}
        {selectedTab === 1 && <DataProductsView />}
        {selectedTab === 2 && <DataContractsView />}
        {selectedTab === 3 && <BusinessGlossariesView />}
        {selectedTab === 4 && <CatalogCommanderView />}
        {selectedTab === 5 && <AboutView />}
      </Box>
    </Box>
  );
}

export default App;
