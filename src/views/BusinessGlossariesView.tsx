import React, { useState } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  ButtonGroup,
  Button,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';

interface GlossaryTerm {
  id: string;
  name: string;
  description: string;
  domain: string;
  owner: string;
  status: 'active' | 'draft' | 'deprecated';
  created: string;
  updated: string;
  taggedAssets: Array<{
    id: string;
    name: string;
    type: 'table' | 'view' | 'column';
    path: string;
  }>;
}

interface Domain {
  id: string;
  name: string;
}

function BusinessGlossariesView() {
  // Mock data - replace with actual API calls
  const domains: Domain[] = [
    { id: 'finance', name: 'Finance' },
    { id: 'sales', name: 'Sales' },
    { id: 'marketing', name: 'Marketing' },
    { id: 'hr', name: 'Human Resources' },
  ];

  const mockTerms: GlossaryTerm[] = [
    {
      id: '1',
      name: 'Revenue',
      description: 'Income generated from normal business operations',
      domain: 'finance',
      owner: 'Finance Team',
      status: 'active',
      created: '2024-01-01',
      updated: '2024-01-15',
      taggedAssets: [
        { id: '1', name: 'monthly_revenue', type: 'table', path: 'finance.reporting.monthly_revenue' },
        { id: '2', name: 'revenue_column', type: 'column', path: 'sales.transactions.amount' },
      ],
    },
    // Add more mock terms...
  ];

  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [terms] = useState<GlossaryTerm[]>(mockTerms);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const handleAddTerm = () => {
    setEditMode(false);
    setOpenDialog(true);
  };

  const handleEditTerm = () => {
    if (selectedTerm) {
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeleteTerm = () => {
    // Implement delete functionality
    console.log('Delete term:', selectedTerm?.id);
  };

  const handleSaveTerm = () => {
    // Implement save functionality
    setOpenDialog(false);
  };

  return (
    <Container maxWidth="xl">
      <Grid container spacing={2}>
        {/* Domain Selection and Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Business Domain</InputLabel>
                  <Select
                    value={selectedDomain}
                    label="Business Domain"
                    onChange={(e) => setSelectedDomain(e.target.value)}
                  >
                    {domains.map((domain) => (
                      <MenuItem key={domain.id} value={domain.id}>
                        {domain.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item>
                <ButtonGroup variant="contained">
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddTerm}
                  >
                    Add Term
                  </Button>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={handleEditTerm}
                    disabled={!selectedTerm}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    onClick={handleDeleteTerm}
                    disabled={!selectedTerm}
                    color="error"
                  >
                    Delete
                  </Button>
                </ButtonGroup>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Glossary Terms List and Details */}
        <Grid item xs={4}>
          <Paper sx={{ height: '70vh', overflow: 'auto' }}>
            <List>
              {terms
                .filter(term => !selectedDomain || term.domain === selectedDomain)
                .map((term) => (
                  <ListItemButton
                    key={term.id}
                    selected={selectedTerm?.id === term.id}
                    onClick={() => setSelectedTerm(term)}
                  >
                    <ListItemText
                      primary={term.name}
                      secondary={`${term.domain} • ${term.status}`}
                    />
                  </ListItemButton>
                ))}
            </List>
          </Paper>
        </Grid>

        {/* Term Details */}
        <Grid item xs={8}>
          <Paper sx={{ height: '70vh', overflow: 'auto', p: 2 }}>
            {selectedTerm ? (
              <>
                <Typography variant="h6" gutterBottom>
                  {selectedTerm.name}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Details
                    </Typography>
                    <Typography variant="body2">
                      Description: {selectedTerm.description}
                    </Typography>
                    <Typography variant="body2">
                      Domain: {selectedTerm.domain}
                    </Typography>
                    <Typography variant="body2">
                      Owner: {selectedTerm.owner}
                    </Typography>
                    <Typography variant="body2">
                      Status: {selectedTerm.status}
                    </Typography>
                    <Typography variant="body2">
                      Created: {selectedTerm.created}
                    </Typography>
                    <Typography variant="body2">
                      Last Updated: {selectedTerm.updated}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Tagged Assets
                    </Typography>
                    <List dense>
                      {selectedTerm.taggedAssets.map((asset) => (
                        <ListItem key={asset.id}>
                          <ListItemButton>
                            <TableChartIcon sx={{ mr: 1 }} />
                            <ListItemText
                              primary={asset.name}
                              secondary={asset.path}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                </Grid>
              </>
            ) : (
              <Typography color="text.secondary" sx={{ p: 2 }}>
                Select a term to view its details
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Term Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          {editMode ? 'Edit Term' : 'Add New Term'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Term Name"
              fullWidth
              defaultValue={editMode ? selectedTerm?.name : ''}
            />
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              defaultValue={editMode ? selectedTerm?.description : ''}
            />
            <FormControl fullWidth>
              <InputLabel>Domain</InputLabel>
              <Select
                value={editMode ? selectedTerm?.domain : selectedDomain}
                label="Domain"
              >
                {domains.map((domain) => (
                  <MenuItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Owner"
              fullWidth
              defaultValue={editMode ? selectedTerm?.owner : ''}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveTerm} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default BusinessGlossariesView; 