import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';

interface DataContract {
  id: string;
  name: string;
  description: string;
  schema_version: string;
  data_format: string;
  schema_definition: {
    columns: Array<{
      name: string;
      type: string;
      description?: string;
      nullable?: boolean;
    }>;
  };
  validation_rules: string[];
  status: 'draft' | 'active' | 'deprecated';
  created_at: string;
  updated_at: string;
}

function DataContractsView() {
  const [contracts, setContracts] = useState<DataContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DataContract | null>(null);
  const [openDetails, setOpenDetails] = useState(false);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = () => {
    setSelectedContract(null);
    setOpenDialog(true);
  };

  const handleEditContract = (contract: DataContract) => {
    setSelectedContract(contract);
    setOpenDialog(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contract');
      await fetchContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  };

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const contractData = {
      name: formData.get('name'),
      description: formData.get('description'),
      schema_version: formData.get('schema_version'),
      data_format: formData.get('data_format'),
      schema_definition: {
        columns: JSON.parse(formData.get('schema_definition') as string),
      },
      validation_rules: (formData.get('validation_rules') as string).split('\n').filter(Boolean),
    };

    try {
      const response = await fetch('/api/contracts', {
        method: selectedContract ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
      });
      if (!response.ok) throw new Error('Failed to save contract');
      await fetchContracts();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contract');
    }
  };

  const handleViewDetails = (contract: DataContract) => {
    setSelectedContract(contract);
    setOpenDetails(true);
  };

  if (loading) return <Typography>Loading contracts...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="xl">
      <Grid container spacing={2}>
        <Grid item xs={12} sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">Data Contracts</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateContract}
          >
            Create Contract
          </Button>
        </Grid>

        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Version</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.name}</TableCell>
                    <TableCell>{contract.schema_version}</TableCell>
                    <TableCell>{contract.data_format}</TableCell>
                    <TableCell>
                      <Chip
                        label={contract.status}
                        color={
                          contract.status === 'active' ? 'success' :
                          contract.status === 'draft' ? 'warning' : 'error'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(contract.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewDetails(contract)} size="small">
                        <InfoIcon />
                      </IconButton>
                      <IconButton onClick={() => handleEditContract(contract)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteContract(contract.id)} size="small" color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveContract}>
          <DialogTitle>
            {selectedContract ? 'Edit Contract' : 'Create Contract'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="name"
                label="Contract Name"
                defaultValue={selectedContract?.name}
                required
                fullWidth
              />
              <TextField
                name="description"
                label="Description"
                defaultValue={selectedContract?.description}
                multiline
                rows={3}
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    name="schema_version"
                    label="Schema Version"
                    defaultValue={selectedContract?.schema_version}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Data Format</InputLabel>
                    <Select
                      name="data_format"
                      defaultValue={selectedContract?.data_format || 'delta'}
                      label="Data Format"
                      required
                    >
                      <MenuItem value="delta">Delta</MenuItem>
                      <MenuItem value="parquet">Parquet</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                name="schema_definition"
                label="Schema Definition (JSON)"
                defaultValue={JSON.stringify(selectedContract?.schema_definition || { columns: [] }, null, 2)}
                multiline
                rows={6}
                required
                fullWidth
              />
              <TextField
                name="validation_rules"
                label="Validation Rules (One per line)"
                defaultValue={selectedContract?.validation_rules?.join('\n')}
                multiline
                rows={4}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={openDetails} onClose={() => setOpenDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>Contract Details</DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6">{selectedContract.name}</Typography>
              <Typography color="text.secondary" paragraph>
                {selectedContract.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Basic Information</Typography>
                  <Typography variant="body2">Version: {selectedContract.schema_version}</Typography>
                  <Typography variant="body2">Format: {selectedContract.data_format}</Typography>
                  <Typography variant="body2">Status: {selectedContract.status}</Typography>
                  <Typography variant="body2">
                    Created: {new Date(selectedContract.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Updated: {new Date(selectedContract.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Schema</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Column</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Nullable</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedContract.schema_definition.columns.map((col, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{col.name}</TableCell>
                            <TableCell>{col.type}</TableCell>
                            <TableCell>{col.nullable ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2">Validation Rules</Typography>
                  {selectedContract.validation_rules.map((rule, idx) => (
                    <Typography key={idx} variant="body2">• {rule}</Typography>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DataContractsView; 