import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import HomeView from './views/HomeView';
import DataContractsView from './views/DataContractsView';
import DataProductsView from './views/DataProductsView';
import CatalogCommanderView from './views/CatalogCommanderView';
import BusinessGlossariesView from './views/BusinessGlossariesView';
import EntitlementsView from './views/EntitlementsView';
import SettingsView from './views/SettingsView';
import AboutView from './views/AboutView';
import NotFoundView from './views/NotFoundView';
import MasterDataManagementView from './views/MasterDataManagementView';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/data-contracts" element={<DataContractsView />} />
            <Route path="/data-products" element={<DataProductsView />} />
            <Route path="/business-glossary" element={<BusinessGlossariesView />} />
            <Route path="/master-data" element={<MasterDataManagementView />} />
            <Route path="/catalog-commander" element={<CatalogCommanderView />} />
            <Route path="/entitlements" element={<EntitlementsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/about" element={<AboutView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
