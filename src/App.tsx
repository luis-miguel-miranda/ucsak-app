import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  FormGroup,
  FormLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import VerifiedIcon from '@mui/icons-material/Verified';
import WarningIcon from '@mui/icons-material/Warning';
import { Checkbox } from '@mui/material';

interface DataContract {
  id: string;
  name: string;
  status: 'verified' | 'unverified';
  createdAt: Date;
}

function App() {
  const [contracts, setContracts] = useState<DataContract[]>([]);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Summary calculations
  const totalContracts = contracts.length;
  const verifiedContracts = contracts.filter(c => c.status === 'verified').length;

  const handleCreateContract = () => {
    // Implementation for creating new contract
    const newContract: DataContract = {
      id: Date.now().toString(),
      name: `Contract ${contracts.length + 1}`,
      status: 'unverified',
      createdAt: new Date()
    };
    setContracts([...contracts, newContract]);
    setCreateDialogOpen(false);
  };

  const handleDeleteContract = (id: string) => {
    setContracts(contracts.filter(c => c.id !== id));
  };

  const handleVerifyContract = (id: string) => {
    setContracts(contracts.map(c => 
      c.id === id ? { ...c, status: 'verified' } : c
    ));
  };

  useEffect(() => {
    fetch('/api/time')
      .then(response => response.json())
      .then(data => setCurrentTime(data.time));
  }, []);

  return (
    <Container maxWidth="lg">
      {/* Summary Section */}
      <Paper sx={{ p: 3, mb: 3, mt: 3 }}>
        <Typography variant="h4" gutterBottom>
          Data Contracts Dashboard
        </Typography>
        <Stack direction="row" spacing={4}>
          <Box>
            <Typography variant="h6">Total Contracts</Typography>
            <Typography variant="h3">{totalContracts}</Typography>
          </Box>
          <Box>
            <Typography variant="h6">Verified Contracts</Typography>
            <Typography variant="h3">{verifiedContracts}</Typography>
          </Box>
        </Stack>
      </Paper>
      <Typography variant="h6">The current time is {currentTime}.</Typography>

      {/* Controls Section */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Contract
        </Button>
      </Box>

      {/* Contracts List */}
      <Stack spacing={2}>
        {contracts.map(contract => (
          <Paper key={contract.id} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6">{contract.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Created: {contract.createdAt.toLocaleDateString()}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton
                  color={contract.status === 'verified' ? 'success' : 'default'}
                  onClick={() => handleVerifyContract(contract.id)}
                >
                  {contract.status === 'verified' ? <VerifiedIcon /> : <WarningIcon />}
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteContract(contract.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>

      {/* Enhanced Create Contract Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Create New Data Contract
          </Typography>
          
          <Stack spacing={3}>
            <TextField
              label="Contract Name"
              fullWidth
              required
              helperText="A unique identifier for this data contract"
            />

            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              helperText="Describe the purpose and scope of this data contract"
            />

            <FormControl fullWidth>
              <InputLabel>Data Format</InputLabel>
              <Select
                label="Data Format"
                defaultValue="json"
              >
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="avro">Avro</MenuItem>
                <MenuItem value="parquet">Parquet</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Schema Version</InputLabel>
              <Select
                label="Schema Version"
                defaultValue="1.0"
              >
                <MenuItem value="1.0">1.0</MenuItem>
                <MenuItem value="1.1">1.1</MenuItem>
                <MenuItem value="2.0">2.0</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Schema Definition"
              fullWidth
              multiline
              rows={6}
              helperText="Enter the schema definition in the selected format"
            />

            <FormControl>
              <FormLabel>Validation Rules</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox />}
                  label="Required Fields Validation"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Data Type Validation"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Range Validation"
                />
                <FormControlLabel
                  control={<Checkbox />}
                  label="Pattern Matching"
                />
              </FormGroup>
            </FormControl>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button 
                onClick={() => setCreateDialogOpen(false)}
                color="inherit"
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleCreateContract}
              >
                Create Contract
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Dialog>
    </Container>
  );
}

export default App;
