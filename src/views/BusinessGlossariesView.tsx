import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ClearIcon from '@mui/icons-material/Clear';
import PageHeader from '../components/PageHeader';

interface GlossaryTerm {
  id: string;
  name: string;
  definition: string;
  domain: string;
  owner: string;
  status: string;
  created: string;
  updated: string;
  synonyms: string[];
  related_terms: string[];
  tags: string[];
  examples: string[];
  source?: string;
  taggedAssets?: Array<{
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
  const [domains, setDomains] = useState<Domain[]>([]);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [filteredTerms, setFilteredTerms] = useState<GlossaryTerm[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDomains();
    fetchTerms();
  }, []);

  useEffect(() => {
    if (selectedDomain) {
      // Filter terms by selected domain
      const filteredTerms = terms.filter(term => term.domain === selectedDomain);
      setFilteredTerms(filteredTerms);
    } else {
      // No domain filter, show all terms
      setFilteredTerms(terms);
    }
  }, [selectedDomain, terms]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/business-glossary/domains');
      if (!response.ok) throw new Error('Failed to fetch domains');
      const data = await response.json();
      setDomains(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load domains');
    }
  };

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/business-glossary/terms');
      if (!response.ok) throw new Error('Failed to fetch glossary terms');
      const data = await response.json();
      setTerms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load glossary terms');
    } finally {
      setLoading(false);
    }
  };

  const fetchTerm = async (id: string) => {
    try {
      const response = await fetch(`/api/business-glossary/terms/${id}`);
      if (!response.ok) throw new Error('Failed to fetch term details');
      const data = await response.json();
      setSelectedTerm(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load term details');
    }
  };

  const createTerm = async (formData: any) => {
    try {
      const response = await fetch('/api/business-glossary/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create term');
      fetchTerms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create term');
    }
  };

  const updateTerm = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/business-glossary/terms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update term');
      fetchTerms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update term');
    }
  };

  const deleteTerm = async (id: string) => {
    try {
      const response = await fetch(`/api/business-glossary/terms/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete term');
      fetchTerms();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete term');
    }
  };

  const handleSaveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const termData: Partial<GlossaryTerm> = {
      name: formData.get('name') as string,
      definition: formData.get('description') as string,
      domain: formData.get('domain') as string,
      owner: formData.get('owner') as string,
      status: 'active',
      synonyms: [],
      related_terms: [],
      tags: [],
      examples: []
    };
    
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `/api/business-glossary/terms/${selectedTerm?.id}`
        : '/api/business-glossary/terms';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(termData),
      });

      if (!response.ok) throw new Error('Failed to save term');
      
      fetchTerms();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save term');
    }
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    
    if (!window.confirm('Are you sure you want to delete this term?')) return;

    try {
      await deleteTerm(selectedTerm.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete term');
    }
  };

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

  const handleSelectTerm = (term: GlossaryTerm) => {
    setSelectedTerm(term);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        icon={<MenuBookIcon />}
        title="Business Glossaries"
        subtitle="Manage business terms and definitions"
      />
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
                    endAdornment={
                      selectedDomain && (
                        <IconButton
                          size="small"
                          sx={{ mr: 2 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDomain('');
                          }}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      )
                    }
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
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddTerm}
                >
                  Add Term
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Terms List and Details */}
        <Grid item xs={4}>
          <Paper sx={{ height: '70vh', overflow: 'auto' }}>
            <List>
              {filteredTerms.map((term) => (
                <ListItem key={term.id} disablePadding>
                  <ListItemButton
                    selected={selectedTerm?.id === term.id}
                    onClick={() => handleSelectTerm(term)}
                  >
                    <ListItemText
                      primary={term.name}
                      secondary={`${term.domain} • ${term.owner}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Term Details */}
        <Grid item xs={8}>
          <Paper sx={{ p: 2, height: '70vh', overflow: 'auto' }}>
            {selectedTerm ? (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedTerm.name}</Typography>
                  <ButtonGroup>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleEditTerm}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={handleDeleteTerm}
                      color="error"
                    >
                      Delete
                    </Button>
                  </ButtonGroup>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" gutterBottom>
                      Details
                    </Typography>
                    <Typography variant="body2">
                      Description: {selectedTerm.definition}
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
                      {selectedTerm.taggedAssets && selectedTerm.taggedAssets.length > 0 ? (
                        selectedTerm.taggedAssets.map((asset) => (
                          <ListItem key={asset.id}>
                            <TableChartIcon sx={{ mr: 1 }} fontSize="small" />
                            <ListItemText
                              primary={asset.name}
                              secondary={asset.path}
                            />
                          </ListItem>
                        ))
                      ) : (
                        <Typography color="text.secondary" sx={{ p: 1 }}>
                          No assets tagged
                        </Typography>
                      )}
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
        <form onSubmit={handleSaveTerm}>
          <DialogTitle>
            {editMode ? 'Edit Term' : 'Add New Term'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="name"
                label="Term Name"
                fullWidth
                defaultValue={editMode ? selectedTerm?.name : ''}
              />
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                defaultValue={editMode ? selectedTerm?.definition : ''}
              />
              <FormControl fullWidth>
                <InputLabel>Domain</InputLabel>
                <Select
                  name="domain"
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
                name="owner"
                label="Owner"
                fullWidth
                defaultValue={editMode ? selectedTerm?.owner : ''}
              />
              {editMode && selectedTerm?.taggedAssets && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tagged Assets
                  </Typography>
                  <List dense>
                    {selectedTerm.taggedAssets.map((asset) => (
                      <ListItem key={asset.id} dense>
                        <TableChartIcon sx={{ mr: 1 }} fontSize="small" />
                        <ListItemText
                          primary={asset.name}
                          secondary={asset.path}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default BusinessGlossariesView; 