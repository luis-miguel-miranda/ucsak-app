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
import DescriptionIcon from '@mui/icons-material/Description';
import PageHeader from '../components/PageHeader';
import { DataContract } from '../types/DataContract';

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
      setLoading(true);
      const response = await fetch('/api/data-contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchContract = async (id: string) => {
    try {
      const response = await fetch(`/api/data-contracts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contract details');
      const data = await response.json();
      setSelectedContract(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract details');
    }
  };

  const createContract = async (formData: any) => {
    try {
      const response = await fetch('/api/data-contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create contract');
      fetchContracts();
      // ... handle success ...
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
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
      const response = await fetch(`/api/data-contracts/${id}`, {
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
    const contractData: Partial<DataContract> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      version: formData.get('version') as string,
      format: formData.get('format') as string,
      owner: formData.get('owner') as string,
      schema: {
        fields: JSON.parse(formData.get('schema_definition') as string || '[]')
      },
      // Other fields will be set by the backend
    };

    try {
      const response = await fetch('/api/data-contracts', {
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
      <PageHeader
        title="Data Contracts"
        subtitle="Create and manage data contracts between producers and consumers"
        icon={<DescriptionIcon fontSize="large" />}
      />
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
                  <TableCell>Created</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.name}</TableCell>
                    <TableCell>{contract.version}</TableCell>
                    <TableCell>{contract.format}</TableCell>
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
                    <TableCell>{new Date(contract.created).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(contract.updated).toLocaleDateString()}</TableCell>
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
                    name="version"
                    label="Schema Version"
                    defaultValue={selectedContract?.version}
                    required
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Data Format</InputLabel>
                    <Select
                      name="format"
                      defaultValue={selectedContract?.format || 'delta'}
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
                defaultValue={JSON.stringify(selectedContract?.schema || { fields: [] }, null, 2)}
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
                  <Typography variant="body2">Version: {selectedContract.version}</Typography>
                  <Typography variant="body2">Format: {selectedContract.format}</Typography>
                  <Typography variant="body2">Status: {selectedContract.status}</Typography>
                  <Typography variant="body2">
                    Created: {new Date(selectedContract.created).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Updated: {new Date(selectedContract.updated).toLocaleString()}
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
                        {selectedContract.schema?.fields.map((col, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{col.name}</TableCell>
                            <TableCell>{col.type}</TableCell>
                            <TableCell>{!col.required ? 'Yes' : 'No'}</TableCell>
                          </TableRow>
                        )) || (
                          <TableRow>
                            <TableCell colSpan={3}>
                              <Typography align="center" color="text.secondary">
                                No schema fields defined
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2">Validation Rules</Typography>
                  {selectedContract.validation_rules?.map((rule, idx) => (
                    <Typography key={idx} variant="body2">• {rule}</Typography>
                  )) || (
                    <Typography color="text.secondary">No validation rules defined</Typography>
                  )}
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