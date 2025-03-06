import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
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
  Alert,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import PageHeader from '../components/PageHeader';

interface Privilege {
  securable_id: string;
  securable_type: string;
  permission: string;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  privileges: Privilege[];
  groups: string[];
}

function EntitlementsView() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPrivilegeDialog, setOpenPrivilegeDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPrivilege, setNewPrivilege] = useState<Partial<Privilege>>({
    securable_id: '',
    securable_type: 'table',
    permission: 'READ'
  });
  const [availableGroups] = useState<string[]>([
    'data_science_team',
    'ml_engineers',
    'data_engineering',
    'etl_team',
    'business_analysts',
    'reporting_team',
    'data_governance',
    'data_stewards',
    'compliance_team',
    'business_users',
    'report_viewers',
    'model_developers',
    'pipeline_operators',
    'analytics_users'
  ]);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/entitlements/personas');
      if (!response.ok) throw new Error('Failed to fetch personas');
      const data = await response.json();
      setPersonas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personas');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPersona = (persona: Persona) => {
    setSelectedPersona(persona);
  };

  const handleAddPersona = () => {
    setEditMode(false);
    setSelectedPersona(null);
    setOpenDialog(true);
  };

  const handleEditPersona = () => {
    if (selectedPersona) {
      setEditMode(true);
      setOpenDialog(true);
    }
  };

  const handleDeletePersona = async () => {
    if (!selectedPersona) return;
    
    try {
      const response = await fetch(`/api/entitlements/personas/${selectedPersona.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete persona');
      
      fetchPersonas();
      setSelectedPersona(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete persona');
    }
  };

  const handleSavePersona = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const personaData: Partial<Persona> = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    };
    
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode 
        ? `/api/entitlements/personas/${selectedPersona?.id}`
        : '/api/entitlements/personas';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personaData),
      });

      if (!response.ok) throw new Error('Failed to save persona');
      
      fetchPersonas();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save persona');
    }
  };

  const handleAddPrivilege = () => {
    setOpenPrivilegeDialog(true);
  };

  const handleSavePrivilege = async () => {
    if (!selectedPersona || !newPrivilege.securable_id) return;
    
    try {
      const response = await fetch(`/api/entitlements/personas/${selectedPersona.id}/privileges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrivilege),
      });

      if (!response.ok) throw new Error('Failed to add privilege');
      
      const updatedPersona = await response.json();
      setSelectedPersona(updatedPersona);
      
      // Update the persona in the list
      setPersonas(personas.map(p => 
        p.id === updatedPersona.id ? updatedPersona : p
      ));
      
      setOpenPrivilegeDialog(false);
      setNewPrivilege({
        securable_id: '',
        securable_type: 'table',
        permission: 'READ'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add privilege');
    }
  };

  const handleRemovePrivilege = async (securableId: string) => {
    if (!selectedPersona) return;
    
    try {
      const response = await fetch(`/api/entitlements/personas/${selectedPersona.id}/privileges/${securableId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to remove privilege');
      
      const updatedPersona = await response.json();
      setSelectedPersona(updatedPersona);
      
      // Update the persona in the list
      setPersonas(personas.map(p => 
        p.id === updatedPersona.id ? updatedPersona : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove privilege');
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'READ':
        return 'info';
      case 'WRITE':
        return 'success';
      case 'MANAGE':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleUpdateGroups = async (personaId: string, groups: string[]) => {
    try {
      const response = await fetch(`/api/entitlements/personas/${personaId}/groups`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groups }),
      });

      if (!response.ok) throw new Error('Failed to update groups');
      
      const updatedPersona = await response.json();
      setSelectedPersona(updatedPersona);
      
      // Update the persona in the list
      setPersonas(personas.map(p => 
        p.id === updatedPersona.id ? updatedPersona : p
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update groups');
    }
  };

  return (
    <Container maxWidth="xl">
      <PageHeader 
        title="Entitlements"
        subtitle="Manage access control personas and privileges"
        icon={<SecurityIcon fontSize="large" />}
      />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Personas List */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '70vh' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Personas
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddPersona}
              >
                Add Persona
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : personas.length === 0 ? (
              <Typography sx={{ p: 2 }}>No personas found. Create one to get started.</Typography>
            ) : (
              <List sx={{ overflow: 'auto', flexGrow: 1 }}>
                {personas.map((persona) => (
                  <ListItemButton
                    key={persona.id}
                    selected={selectedPersona?.id === persona.id}
                    onClick={() => handleSelectPersona(persona)}
                  >
                    <PersonIcon sx={{ mr: 2 }} />
                    <ListItemText 
                      primary={persona.name} 
                      secondary={`${persona.privileges.length} privileges`} 
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
        
        {/* Persona Details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '70vh' }}>
            {selectedPersona ? (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="h2">
                    {selectedPersona.name}
                  </Typography>
                  <Box>
                    <IconButton color="primary" onClick={handleEditPersona}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={handleDeletePersona}>
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
                
                <Typography variant="body1" color="text.secondary" paragraph>
                  {selectedPersona.description || 'No description provided.'}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" component="h3">
                      Access Privileges
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAddPrivilege}
                    >
                      Add Privilege
                    </Button>
                  </Box>
                  
                  {selectedPersona.privileges.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No privileges assigned to this persona.
                    </Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Securable</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Permission</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {selectedPersona.privileges.map((privilege) => (
                            <TableRow key={privilege.securable_id}>
                              <TableCell>{privilege.securable_id}</TableCell>
                              <TableCell>{privilege.securable_type}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={privilege.permission} 
                                  color={getPermissionColor(privilege.permission) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleRemovePrivilege(privilege.securable_id)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
                
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Group Assignments
                  </Typography>
                  <Autocomplete
                    multiple
                    options={availableGroups}
                    value={selectedPersona.groups}
                    onChange={(_, newValue) => {
                      if (selectedPersona) {
                        handleUpdateGroups(selectedPersona.id, newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Assigned Groups"
                        placeholder="Add groups..."
                      />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((group, index) => (
                        <Chip
                          label={group}
                          {...getTagProps({ index })}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    }
                  />
                </Box>
                
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Created: {new Date(selectedPersona.created_at).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Last updated: {new Date(selectedPersona.updated_at).toLocaleString()}
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <SecurityIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Select a persona to view details
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Or create a new one using the "Add Persona" button
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Add/Edit Persona Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSavePersona}>
          <DialogTitle>
            {editMode ? 'Edit Persona' : 'Create New Persona'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              name="name"
              label="Persona Name"
              type="text"
              fullWidth
              variant="outlined"
              defaultValue={editMode && selectedPersona ? selectedPersona.name : ''}
              required
              sx={{ mb: 2, mt: 1 }}
            />
            <TextField
              margin="dense"
              id="description"
              name="description"
              label="Description"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              defaultValue={editMode && selectedPersona ? selectedPersona.description : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Add Privilege Dialog */}
      <Dialog open={openPrivilegeDialog} onClose={() => setOpenPrivilegeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Access Privilege</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="securable_id"
            label="Securable ID"
            type="text"
            fullWidth
            variant="outlined"
            value={newPrivilege.securable_id}
            onChange={(e) => setNewPrivilege({...newPrivilege, securable_id: e.target.value})}
            required
            helperText="Example: catalog.schema.table"
            sx={{ mb: 2, mt: 1 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="securable-type-label">Securable Type</InputLabel>
            <Select
              labelId="securable-type-label"
              id="securable_type"
              value={newPrivilege.securable_type}
              label="Securable Type"
              onChange={(e) => setNewPrivilege({...newPrivilege, securable_type: e.target.value})}
            >
              <MenuItem value="catalog">Catalog</MenuItem>
              <MenuItem value="schema">Schema</MenuItem>
              <MenuItem value="table">Table</MenuItem>
              <MenuItem value="view">View</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth>
            <InputLabel id="permission-label">Permission</InputLabel>
            <Select
              labelId="permission-label"
              id="permission"
              value={newPrivilege.permission}
              label="Permission"
              onChange={(e) => setNewPrivilege({...newPrivilege, permission: e.target.value})}
            >
              <MenuItem value="READ">READ</MenuItem>
              <MenuItem value="WRITE">WRITE</MenuItem>
              <MenuItem value="MANAGE">MANAGE</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrivilegeDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSavePrivilege} 
            variant="contained"
            disabled={!newPrivilege.securable_id}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default EntitlementsView; 