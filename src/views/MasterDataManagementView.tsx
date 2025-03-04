import React, { useState } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Alert,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import PageHeader from '../components/PageHeader';

interface Dataset {
  id: string;
  name: string;
  catalog: string;
  schema: string;
  table: string;
  entityColumn: string;
  type: 'customer' | 'product' | 'supplier' | 'location';
  totalRecords: number;
}

interface ComparisonResult {
  datasetA: string;
  datasetB: string;
  matchingEntities: number;
  uniqueToA: number;
  uniqueToB: number;
  matchScore: number;
}

interface DetailedComparisonResult extends ComparisonResult {
  commonColumns: string[];
  sampleMatches: Array<{
    entityA: string;
    entityB: string;
    confidence: number;
  }>;
  columnStats: Array<{
    column: string;
    matchRate: number;
    nullRate: number;
  }>;
}

function MasterDataManagementView() {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [entityType, setEntityType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
  const [detailedResults, setDetailedResults] = useState<DetailedComparisonResult[]>([]);
  const [selectedComparison, setSelectedComparison] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mock data - replace with API calls
  const datasets: Dataset[] = [
    {
      id: '1',
      name: 'CRM Customers',
      catalog: 'sales',
      schema: 'crm',
      table: 'customers',
      entityColumn: 'customer_id',
      type: 'customer',
      totalRecords: 50000
    },
    {
      id: '2',
      name: 'ERP Customers',
      catalog: 'finance',
      schema: 'erp',
      table: 'customers',
      entityColumn: 'cust_id',
      type: 'customer',
      totalRecords: 45000
    },
    {
      id: '3',
      name: 'Marketing Contacts',
      catalog: 'marketing',
      schema: 'campaigns',
      table: 'contacts',
      entityColumn: 'contact_id',
      type: 'customer',
      totalRecords: 75000
    },
    {
      id: '4',
      name: 'Product Catalog',
      catalog: 'products',
      schema: 'master',
      table: 'products',
      entityColumn: 'product_id',
      type: 'product',
      totalRecords: 25000
    },
    {
      id: '5',
      name: 'ERP Products',
      catalog: 'finance',
      schema: 'erp',
      table: 'products',
      entityColumn: 'sku',
      type: 'product',
      totalRecords: 22000
    },
    {
      id: '6',
      name: 'Supplier Directory',
      catalog: 'procurement',
      schema: 'master',
      table: 'suppliers',
      entityColumn: 'supplier_id',
      type: 'supplier',
      totalRecords: 5000
    },
    {
      id: '7',
      name: 'Store Locations',
      catalog: 'retail',
      schema: 'master',
      table: 'locations',
      entityColumn: 'location_id',
      type: 'location',
      totalRecords: 1200
    },
    {
      id: '8',
      name: 'Warehouse Locations',
      catalog: 'logistics',
      schema: 'master',
      table: 'warehouses',
      entityColumn: 'warehouse_id',
      type: 'location',
      totalRecords: 150
    }
  ];

  const handleAnalyze = async () => {
    if (selectedDatasets.length < 2) {
      setError('Please select at least two datasets to compare');
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      // Mock API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock detailed results
      const mockResults: DetailedComparisonResult[] = [];
      for (let i = 0; i < selectedDatasets.length; i++) {
        for (let j = i + 1; j < selectedDatasets.length; j++) {
          const datasetA = datasets.find(d => d.id === selectedDatasets[i]);
          const datasetB = datasets.find(d => d.id === selectedDatasets[j]);
          
          if (!datasetA || !datasetB) continue;

          mockResults.push({
            datasetA: datasetA.name,
            datasetB: datasetB.name,
            matchingEntities: Math.floor(Math.random() * 40000),
            uniqueToA: Math.floor(Math.random() * 10000),
            uniqueToB: Math.floor(Math.random() * 10000),
            matchScore: Math.random() * 100,
            commonColumns: ['id', 'name', 'email', 'phone', 'address'],
            sampleMatches: [
              { entityA: "CUST001", entityB: "C-001", confidence: 0.95 },
              { entityA: "CUST002", entityB: "C-002", confidence: 0.88 },
              { entityA: "CUST003", entityB: "C-003", confidence: 0.92 }
            ],
            columnStats: [
              { column: 'id', matchRate: 0.95, nullRate: 0.01 },
              { column: 'name', matchRate: 0.85, nullRate: 0.05 },
              { column: 'email', matchRate: 0.75, nullRate: 0.15 },
              { column: 'phone', matchRate: 0.65, nullRate: 0.25 }
            ]
          });
        }
      }
      
      setDetailedResults(mockResults);
      setResults(mockResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze datasets');
    } finally {
      setAnalyzing(false);
    }
  };

  const renderDetailedResults = () => {
    if (!selectedComparison) return null;
    
    const detail = detailedResults.find(r => 
      `${r.datasetA}-${r.datasetB}` === selectedComparison
    );
    
    if (!detail) return null;

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Detailed Analysis: {detail.datasetA} vs {detail.datasetB}
        </Typography>

        {/* Common Columns */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Common Columns</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {detail.commonColumns.map(col => (
              <Chip key={col} label={col} size="small" />
            ))}
          </Box>
        </Box>

        {/* Column Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>Column Statistics</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Column</TableCell>
                  <TableCell align="right">Match Rate</TableCell>
                  <TableCell align="right">Null Rate</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.columnStats.map(stat => (
                  <TableRow key={stat.column}>
                    <TableCell>{stat.column}</TableCell>
                    <TableCell align="right">{(stat.matchRate * 100).toFixed(1)}%</TableCell>
                    <TableCell align="right">{(stat.nullRate * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Sample Matches */}
        <Box>
          <Typography variant="subtitle1" gutterBottom>Sample Matches</Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Entity A</TableCell>
                  <TableCell>Entity B</TableCell>
                  <TableCell align="right">Confidence</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {detail.sampleMatches.map((match, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{match.entityA}</TableCell>
                    <TableCell>{match.entityB}</TableCell>
                    <TableCell align="right">{(match.confidence * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    );
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        icon={<CompareArrowsIcon />}
        title="Master Data Management"
        subtitle="Analyze and manage entity overlaps across your data estate"
      />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dataset Selection
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Entity Type</InputLabel>
                  <Select
                    value={entityType}
                    label="Entity Type"
                    onChange={(e) => setEntityType(e.target.value)}
                  >
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="product">Product</MenuItem>
                    <MenuItem value="supplier">Supplier</MenuItem>
                    <MenuItem value="location">Location</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Datasets to Compare</InputLabel>
                  <Select
                    multiple
                    value={selectedDatasets}
                    label="Datasets to Compare"
                    onChange={(e) => setSelectedDatasets(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value}
                            label={datasets.find(d => d.id === value)?.name}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {datasets.map((dataset) => (
                      <MenuItem key={dataset.id} value={dataset.id}>
                        {dataset.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleAnalyze}
                disabled={analyzing || selectedDatasets.length < 2}
                startIcon={<CompareArrowsIcon />}
              >
                Analyze Overlaps
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Dataset Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Selected Datasets
            </Typography>
            {selectedDatasets.map(id => {
              const dataset = datasets.find(d => d.id === id);
              return dataset ? (
                <Box key={id} sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">
                    {dataset.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Path: {dataset.catalog}.{dataset.schema}.{dataset.table}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Records: {dataset.totalRecords.toLocaleString()}
                  </Typography>
                </Box>
              ) : null;
            })}
          </Paper>
        </Grid>

        {/* Analysis Results */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            
            {analyzing && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <LinearProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {results.length > 0 && (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Dataset A</TableCell>
                      <TableCell>Dataset B</TableCell>
                      <TableCell align="right">Matching Entities</TableCell>
                      <TableCell align="right">Unique to A</TableCell>
                      <TableCell align="right">Unique to B</TableCell>
                      <TableCell align="right">Match Score</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{result.datasetA}</TableCell>
                        <TableCell>{result.datasetB}</TableCell>
                        <TableCell align="right">
                          {result.matchingEntities.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {result.uniqueToA.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {result.uniqueToB.toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {result.matchScore.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Add this after the results table */}
        {results.length > 0 && (
          <Grid item xs={12}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>View Detailed Analysis</InputLabel>
              <Select
                value={selectedComparison || ''}
                label="View Detailed Analysis"
                onChange={(e) => setSelectedComparison(e.target.value)}
              >
                {results.map((result, idx) => (
                  <MenuItem key={idx} value={`${result.datasetA}-${result.datasetB}`}>
                    {result.datasetA} vs {result.datasetB}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {renderDetailedResults()}
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

export default MasterDataManagementView; 