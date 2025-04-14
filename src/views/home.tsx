import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '@/components/ui/search-bar';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Book, GitCompare, Shield, Gavel, FolderKanban, Settings, Info, TrendingUp, FileText as FileTextIcon, BookOpen, ArrowLeftRight, Scale, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UnityCatalogLogo } from '@/components/unity-catalog-logo';

interface Stats {
  dataContracts: { count: number; loading: boolean; error: string | null };
  dataProducts: { count: number; loading: boolean; error: string | null };
  glossaries: { count: { glossaries: number; terms: number }; loading: boolean; error: string | null };
  personas: { count: number; loading: boolean; error: string | null };
  estates: { 
    count: number; 
    loading: boolean; 
    error: string | null;
    lastSync: string | null;
    syncStatus: 'success' | 'failed' | 'in_progress' | null;
  };
}

interface ComplianceData {
  date: string;
  compliance: number;
}

export default function Home() {
  const [stats, setStats] = useState<Stats>({
    dataContracts: { count: 0, loading: true, error: null },
    dataProducts: { count: 0, loading: true, error: null },
    glossaries: { count: { glossaries: 0, terms: 0 }, loading: true, error: null },
    personas: { count: 0, loading: true, error: null },
    estates: { 
      count: 0, 
      loading: true, 
      error: null,
      lastSync: null,
      syncStatus: null
    },
  });
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(true);
  const [complianceError, setComplianceError] = useState<string | null>(null);

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
          glossaries: { 
            count: { 
              glossaries: data.glossaries || 0, 
              terms: data.terms || 0 
            }, 
            loading: false, 
            error: null 
          }
        }));
      })
      .catch(error => {
        console.error('Error fetching glossaries:', error);
        setStats(prev => ({
          ...prev,
          glossaries: { 
            count: { glossaries: 0, terms: 0 }, 
            loading: false, 
            error: error.message 
          }
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

    // Fetch estates count and sync status
    fetch('/api/estates')
      .then(response => response.json())
      .then(data => {
        const lastSync = data.length > 0 
          ? new Date(Math.max(...data.map((estate: any) => new Date(estate.last_sync).getTime())))
          : null;
        
        const syncStatus = data.length > 0
          ? data.every((estate: any) => estate.sync_status === 'success')
            ? 'success'
            : data.some((estate: any) => estate.sync_status === 'in_progress')
              ? 'in_progress'
              : 'failed'
          : null;

        setStats(prev => ({
          ...prev,
          estates: { 
            count: data.length, 
            loading: false, 
            error: null,
            lastSync: lastSync?.toLocaleDateString() || null,
            syncStatus
          }
        }));
      })
      .catch(error => {
        console.error('Error fetching estates:', error);
        setStats(prev => ({
          ...prev,
          estates: { 
            count: 0, 
            loading: false, 
            error: error.message,
            lastSync: null,
            syncStatus: null
          }
        }));
      });

    // Fetch compliance trend data
    fetch('/api/compliance/trend')
      .then(response => response.json())
      .then(data => {
        setComplianceData(data);
        setComplianceLoading(false);
      })
      .catch(error => {
        console.error('Error fetching compliance trend:', error);
        setComplianceError(error.message);
        setComplianceLoading(false);
      });
  }, []);

  const summaryTiles = [
    {
      title: 'Data Products',
      value: stats.dataProducts.count,
      loading: stats.dataProducts.loading,
      error: stats.dataProducts.error,
      link: '/data-products',
      icon: <Database className="h-4 w-4" />,
      description: 'Total data products',
    },
    {
      title: 'Data Contracts',
      value: stats.dataContracts.count,
      loading: stats.dataContracts.loading,
      error: stats.dataContracts.error,
      link: '/data-contracts',
      icon: <FileTextIcon className="h-4 w-4" />,
      description: 'Active contracts',
    },
    {
      title: 'Business Glossary',
      value: `${stats.glossaries.count.glossaries} / ${stats.glossaries.count.terms}`,
      loading: stats.glossaries.loading,
      error: stats.glossaries.error,
      link: '/business-glossary',
      icon: <BookOpen className="h-4 w-4" />,
      description: 'Glossaries / Terms',
    },
    {
      title: 'Compliance',
      value: complianceData.length > 0 ? `${complianceData[complianceData.length - 1].compliance}%` : '0%',
      loading: complianceLoading,
      error: complianceError,
      link: '/compliance',
      icon: <Scale className="h-4 w-4" />,
      description: 'Current compliance score',
    },
    {
      title: 'Estates',
      value: stats.estates.count,
      loading: stats.estates.loading,
      error: stats.estates.error,
      link: '/estate-manager',
      icon: <Globe className="h-4 w-4" />,
      description: stats.estates.lastSync 
        ? `Last sync: ${stats.estates.lastSync} (${stats.estates.syncStatus?.replace('_', ' ') || 'unknown'})`
        : 'No estates configured',
    },
  ];

  const features = [
    {
      name: 'Data Products',
      description: 'Group and manage related Databricks assets with tags',
      icon: <Database className="h-6 w-6" />,
      link: '/data-products',
    },
    {
      name: 'Data Contracts',
      description: 'Define and enforce technical metadata standards',
      icon: <FileTextIcon className="h-6 w-6" />,
      link: '/data-contracts',
    },
    {
      name: 'Business Glossary',
      description: 'Create and manage business terms and definitions',
      icon: <Book className="h-6 w-6" />,
      link: '/business-glossary',
    },
    {
      name: 'Master Data Management',
      description: 'Ensure data quality and consistency across systems',
      icon: <GitCompare className="h-6 w-6" />,
      link: '/master-data',
    },
    {
      name: 'Compliance',
      description: 'Check compliance status of data products',
      icon: <Scale className="h-6 w-6" />,
      link: '/compliance',
    },
    {
      name: 'Entitlements',
      description: 'Manage access privileges and personas',
      icon: <Shield className="h-6 w-6" />,
      link: '/entitlements',
    },
    {
      name: 'Entitlements Sync',
      description: 'Synchronize entitlements with other systems',
      icon: <ArrowLeftRight className="h-6 w-6" />,
      link: '/entitlements-sync',
    },
    {
      name: 'Security Features',
      description: 'Configure advanced security features',
      icon: <Gavel className="h-6 w-6" />,
      link: '/security',
    },
    {
      name: 'Catalog Commander',
      description: 'Side-by-side catalog explorer',
      icon: <FolderKanban className="h-6 w-6" />,
      link: '/catalog-commander',
    },
    {
      name: 'Estate Manager',
      description: 'Manage multiple Databricks instances across regions and clouds',
      icon: <Globe className="h-6 w-6" />,
      link: '/estate-manager',
    },
    {
      name: 'Settings',
      description: 'Configure app settings and jobs',
      icon: <Settings className="h-6 w-6" />,
      link: '/settings',
    },
    {
      name: 'About',
      description: 'Learn more about the application',
      icon: <Info className="h-6 w-6" />,
      link: '/about',
    },
  ];

  return (
    <div className="py-6">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <UnityCatalogLogo />
          <h1 className="text-4xl font-bold">Unity Catalog Swiss Army Knife</h1>
        </div>
        <p className="text-lg text-muted-foreground mb-6">
          Manage business glossaries, data contracts, data products, personas, and more
        </p>
        <div className="mb-8">
          <SearchBar 
            variant="large" 
            placeholder="Search for data products, business terms, contracts..." 
          />
        </div>
      </div>

      {/* Summary Tiles */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryTiles.map((tile) => (
            <Link key={tile.title} to={tile.link} className="block">
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {tile.title}
                    </CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">
                      {tile.icon}
                    </div>
                  </div>
                  {tile.loading ? (
                    <div className="flex justify-center items-center h-24">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : tile.error ? (
                    <div className="text-center text-destructive">
                      Error loading data
                    </div>
                  ) : (
                    <>
                      <div className="text-2xl font-bold mt-2">{tile.value}</div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tile.description}
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Compliance Trend */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Compliance Trend</h3>
                <p className="text-sm text-muted-foreground">Last 30 days</p>
              </div>
            </div>
            <div className="h-[200px]">
              {complianceLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : complianceError ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  {complianceError}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip labelFormatter={(value) => `Date: ${value[0]}`} />
                    <Line type="monotone" dataKey="compliance" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Features */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Link key={feature.name} to={feature.link} className="block">
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {feature.name}
                    </CardTitle>
                    <div className="h-4 w-4 text-muted-foreground">
                      {feature.icon}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}