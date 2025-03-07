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
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import DescriptionIcon from '@mui/icons-material/Description';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import PageHeader from '../components/PageHeader';
import { DataContract } from '../types/DataContract';
import { useDropzone } from 'react-dropzone';

function DataContractsView() {
  const [contracts, setContracts] = useState<DataContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DataContract | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);

  // New Contract Dialog State
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState('draft');
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [contractText, setContractText] = useState('');
  const [newContractError, setNewContractError] = useState<string | null>(null);

  // Upload Dialog State
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add format to state
  const [format, setFormat] = useState('json');

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

  const handleEditContract = async (contract: DataContract) => {
    try {
      // Fetch the full contract details including contract text
      const response = await fetch(`/api/data-contracts/${contract.id}`);
      if (!response.ok) throw new Error('Failed to fetch contract details');
      const fullContract = await response.json();

      // Set form values
      setSelectedContract(fullContract);
      setName(fullContract.name);
      setVersion(fullContract.version);
      setStatus(fullContract.status);
      setOwner(fullContract.owner);
      setDescription(fullContract.description || '');
      setFormat(fullContract.format);
      setContractText(fullContract.contract_text);
      setOpenDialog(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract details');
    }
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

  const handleViewDetails = async (contract: DataContract) => {
    try {
      // Fetch the full contract details including contract text
      const response = await fetch(`/api/data-contracts/${contract.id}`);
      if (!response.ok) throw new Error('Failed to fetch contract details');
      const fullContract = await response.json();
      
      setSelectedContract(fullContract);
      setOpenDetails(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load contract details');
    }
  };

  const handleSaveNewContract = () => {
    try {
      // Validate required fields
      if (!name || !version || !owner || !contractText) {
        setNewContractError('Please fill in all required fields');
        return;
      }

      // Create contract object
      const contract = {
        name,
        version,
        status,
        owner,
        description,
        contract_text: contractText,
        format
      };

      if (selectedContract) {
        // Update existing contract
        fetch(`/api/data-contracts/${selectedContract.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contract)
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to update contract');
          return fetchContracts();
        })
        .then(() => handleCloseNewDialog())
        .catch(err => setNewContractError(err.message));
      } else {
        // Create new contract
        fetch('/api/data-contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contract)
        })
        .then(response => {
          if (!response.ok) throw new Error('Failed to create contract');
          return fetchContracts();
        })
        .then(() => handleCloseNewDialog())
        .catch(err => setNewContractError(err.message));
      }
    } catch (err) {
      setNewContractError(err instanceof Error ? err.message : 'Error saving contract');
    }
  };

  const handleCloseNewDialog = () => {
    setSelectedContract(null);
    setName('');
    setVersion('1.0');
    setStatus('draft');
    setOwner('');
    setDescription('');
    setFormat('json');
    setContractText('');
    setNewContractError(null);
    setOpenDialog(false);
  };

  // Upload Dialog
  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    // Accept any text-based format
    if (!file.type.startsWith('text/') && file.type !== 'application/json' && file.type !== 'application/x-yaml') {
      setUploadError('Please upload a text file (JSON, YAML, etc)');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/data-contracts/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload contract');
      }

      await fetchContracts();
      setOpenUploadDialog(false);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.json', '.yaml', '.yml', '.txt'],
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml']
    },
    multiple: false
  });

  if (loading) return <Typography>Loading contracts...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Data Contracts"
        subtitle="Manage data contracts and their specifications"
        icon={<DescriptionIcon fontSize="large" />}
      />
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          New Contract
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => setOpenUploadDialog(true)}
        >
          Upload Contract
        </Button>
      </Box>
      <Grid container spacing={2}>
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
      <Dialog open={openDialog} onClose={handleCloseNewDialog} maxWidth="md" fullWidth>
        <DialogTitle>{selectedContract ? 'Edit Data Contract' : 'Create New Data Contract'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {newContractError && (
              <Alert severity="error" onClose={() => setNewContractError(null)}>
                {newContractError}
              </Alert>
            )}

            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
                sx={{ width: '30%' }}
              />

              <TextField
                select
                label="Format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                required
                sx={{ width: '30%' }}
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="yaml">YAML</MenuItem>
                <MenuItem value="text">Plain Text</MenuItem>
              </TextField>

              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
                sx={{ width: '40%' }}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Box>

            <TextField
              label="Owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              fullWidth
            />

            <TextField
              label="Contract Definition"
              value={contractText}
              onChange={(e) => setContractText(e.target.value)}
              multiline
              rows={15}
              required
              fullWidth
              placeholder={format === 'yaml' ? 
                `# Example contract in YAML format
name: Example Contract
version: 1.0
domain: example
datasets:
  - name: example_dataset
    type: table
    schema:
      columns:
        - name: id
          type: string
          description: Primary identifier` :
                format === 'json' ?
                `{
  "name": "Example Contract",
  "version": "1.0",
  "domain": "example",
  "datasets": [
    {
      "name": "example_dataset",
      "type": "table",
      "schema": {
        "columns": [
          {
            "name": "id",
            "type": "string",
            "description": "Primary identifier"
          }
        ]
      }
    }
  ]
}` : 
                '# Enter your contract definition here'
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewDialog}>Cancel</Button>
          <Button onClick={handleSaveNewContract} variant="contained">
            {selectedContract ? 'Update Contract' : 'Create Contract'}
          </Button>
        </DialogActions>
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
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2">Basic Information</Typography>
                  <Typography variant="body2">Version: {selectedContract.version}</Typography>
                  <Typography variant="body2">Format: {selectedContract.format}</Typography>
                  <Typography variant="body2">Status: {selectedContract.status}</Typography>
                  <Typography variant="body2">Owner: {selectedContract.owner}</Typography>
                  <Typography variant="body2">
                    Created: {new Date(selectedContract.created).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    Updated: {new Date(selectedContract.updated).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="subtitle2">Contract Definition</Typography>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      mt: 1,
                      maxHeight: '400px',
                      overflow: 'auto',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.875rem'
                    }}
                  >
                    {selectedContract.contract_text}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              if (selectedContract) {
                const blob = new Blob([selectedContract.contract_text], { 
                  type: selectedContract.format === 'json' 
                    ? 'application/json' 
                    : selectedContract.format === 'yaml'
                    ? 'application/x-yaml'
                    : 'text/plain' 
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedContract.name.toLowerCase().replace(/\s+/g, '_')}.${
                  selectedContract.format === 'yaml' ? 'yaml' : 
                  selectedContract.format === 'json' ? 'json' : 'txt'
                }`;
                a.click();
                window.URL.revokeObjectURL(url);
              }
            }}
            startIcon={<DownloadIcon />}
          >
            Download Contract
          </Button>
          <Button onClick={() => setOpenDetails(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onClose={() => setOpenUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Data Contract</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError(null)}>
              {uploadError}
            </Alert>
          )}
          
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.300',
              borderRadius: 1,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="body1" gutterBottom>
                  {isDragActive
                    ? 'Drop the file here'
                    : 'Drag and drop a contract file here, or click to select'}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Supported formats: JSON, YAML, or plain text
                </Typography>
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUploadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default DataContractsView; 