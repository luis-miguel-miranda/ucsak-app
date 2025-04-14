import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme';
import Layout from './components/layout/layout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';

// Import views
import Home from './views/home';
import DataProducts from './views/data-products';
import DataProductDetails from './views/data-product-details';
import DataContracts from './views/data-contracts';
import BusinessGlossary from './views/business-glossary';
import MasterDataManagement from './views/master-data-management';
import Entitlements from './views/entitlements';
import SecurityFeatures from './views/security-features';
import Compliance from './views/compliance';
import CatalogCommander from './views/catalog-commander';
import Settings from './views/settings';
import About from './views/about';
import NotFound from './views/not-found';
import EntitlementsSync from './views/entitlements-sync';
import EstateManager from './views/estate-manager';

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ucapp-theme">
      <TooltipProvider>
        <Router future={{ 
          v7_relativeSplatPath: true,
          v7_startTransition: true 
        }}>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/data-products" element={<DataProducts />} />
              <Route path="/data-products/:productId" element={<DataProductDetails />} />
              <Route path="/data-contracts" element={<DataContracts />} />
              <Route path="/business-glossary" element={<BusinessGlossary />} />
              <Route path="/master-data" element={<MasterDataManagement />} />
              <Route path="/entitlements" element={<Entitlements />} />
              <Route path="/security" element={<SecurityFeatures />} />
              <Route path="/entitlements-sync" element={<EntitlementsSync />} />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/catalog-commander" element={<CatalogCommander />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              <Route path="/estate-manager" element={<EstateManager />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
