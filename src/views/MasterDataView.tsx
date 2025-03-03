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

function MasterDataView() {
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [entityType, setEntityType] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ComparisonResult[]>([]);
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
      
      // Mock results
      const mockResults: ComparisonResult[] = [];
      for (let i = 0; i < selectedDatasets.length; i++) {
        for (let j = i + 1; j < selectedDatasets.length; j++) {
          mockResults.push({
            datasetA: datasets.find(d => d.id === selectedDatasets[i])?.name || '',
            datasetB: datasets.find(d => d.id === selectedDatasets[j])?.name || '',
            matchingEntities: Math.floor(Math.random() * 40000),
            uniqueToA: Math.floor(Math.random() * 10000),
            uniqueToB: Math.floor(Math.random() * 10000),
            matchScore: Math.random() * 100
          });
        }
      }
      
      setResults(mockResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze datasets');
    } finally {
      setAnalyzing(false);
    }
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
      </Grid>
    </Container>
  );
}

export default MasterDataView; 