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
  const [domains, setDomains] = useState<Domain[]>([]);
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
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
    fetchTerms();
  }, [selectedDomain]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/glossary/domains');
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
      const url = selectedDomain 
        ? `/api/glossary/terms?domain=${selectedDomain}`
        : '/api/glossary/terms';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch terms');
      const data = await response.json();
      setTerms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerm = async (formData: Partial<GlossaryTerm>) => {
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `/api/glossary/terms/${selectedTerm?.id}`
        : '/api/glossary/terms';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
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
      const response = await fetch(`/api/glossary/terms/${selectedTerm.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete term');
      
      setSelectedTerm(null);
      fetchTerms();
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
              {terms.map((term) => (
                <ListItem key={term.id} disablePadding>
                  <ListItemButton
                    selected={selectedTerm?.id === term.id}
                    onClick={() => setSelectedTerm(term)}
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
                      {(selectedTerm?.taggedAssets || []).map((asset) => (
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
                      {selectedTerm.taggedAssets?.length === 0 && (
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
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData: Partial<GlossaryTerm> = {
            name: (e.target as any).name.value,
            description: (e.target as any).description.value,
            domain: (e.target as any).domain.value,
            owner: (e.target as any).owner.value,
            status: 'active',
            taggedAssets: editMode ? selectedTerm?.taggedAssets : []
          };
          handleSaveTerm(formData);
        }}>
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
                defaultValue={editMode ? selectedTerm?.description : ''}
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