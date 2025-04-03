import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Layout from './components/Layout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/toaster';

// Import views
import Home from './views/Home';
import DataProducts from './views/DataProducts';
import DataContracts from './views/DataContracts';
import BusinessGlossary from './views/BusinessGlossary';
import MasterDataManagement from './views/MasterDataManagement';
import Entitlements from './views/Entitlements';
import SecurityFeatures from './views/SecurityFeatures';
import Compliance from './views/Compliance';
import CatalogCommander from './views/CatalogCommander';
import Settings from './views/Settings';
import About from './views/About';
import NotFound from './views/NotFound';
import EntitlementsSync from './views/EntitlementsSync';

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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}
