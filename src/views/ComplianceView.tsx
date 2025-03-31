import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PageHeader from '../components/PageHeader';
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  rule: string;
  compliance: number;
  history: number[];
  is_active: boolean;
  severity: string;
  category: string;
}

interface ComplianceStats {
  overall_compliance: number;
  active_policies: number;
  critical_issues: number;
}

export default function ComplianceView() {
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [stats, setStats] = useState<ComplianceStats>({
    overall_compliance: 0,
    active_policies: 0,
    critical_issues: 0
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);
  const [formData, setFormData] = useState<Partial<CompliancePolicy>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [policiesRes, statsRes] = await Promise.all([
        fetch('/api/compliance/policies'),
        fetch('/api/compliance/stats')
      ]);
      
      if (!policiesRes.ok || !statsRes.ok) throw new Error('Failed to fetch data');
      
      const policiesData = await policiesRes.json();
      const statsData = await statsRes.json();
      
      setPolicies(policiesData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load compliance data');
    }
  };

  const handleSave = async () => {
    try {
      const url = editingPolicy 
        ? `/api/compliance/policies/${editingPolicy.id}`
        : '/api/compliance/policies';
      
      const method = editingPolicy ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) throw new Error('Failed to save policy');
      
      setSuccess('Policy saved successfully');
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Failed to save policy');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/compliance/policies/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete policy');
      
      setSuccess('Policy deleted successfully');
      fetchData();
    } catch (err) {
      setError('Failed to delete policy');
    }
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return 'success.main';
    if (score >= 70) return 'warning.main';
    return 'error.main';
  };

  const getComplianceIcon = (score: number) => {
    if (score >= 90) return <CheckCircleIcon color="success" />;
    if (score >= 70) return <WarningIcon color="warning" />;
    return <ErrorIcon color="error" />;
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Compliance"
        subtitle="Monitor and manage compliance policies"
        icon={<GavelIcon />}
      />

      {/* Dashboard Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Overall Compliance</Typography>
              <Typography variant="h3" color="primary">
                {stats.overall_compliance}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active Policies</Typography>
              <Typography variant="h3" color="primary">
                {stats.active_policies}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Critical Issues</Typography>
              <Typography variant="h3" color="error">
                {stats.critical_issues}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Policies List */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => {
              setEditingPolicy(null);
              setFormData({});
              setDialogOpen(true);
            }}
          >
            Add Policy
          </Button>
        </Box>

        <List>
          {policies.map((policy) => (
            <ListItem key={policy.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getComplianceIcon(policy.compliance)}
                    {policy.name}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {policy.description}
                    </Typography>
                    <Box sx={{ mt: 1, width: 200 }}>
                      <Sparklines data={policy.history} height={30}>
                        <SparklinesLine color={getComplianceColor(policy.compliance)} />
                      </Sparklines>
                    </Box>
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <IconButton onClick={() => {
                  setEditingPolicy(policy);
                  setFormData(policy);
                  setDialogOpen(true);
                }}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDelete(policy.id)}>
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPolicy ? 'Edit Policy' : 'Add Policy'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Policy Name"
            margin="normal"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={2}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <TextField
            fullWidth
            label="Policy Rule"
            margin="normal"
            multiline
            rows={4}
            value={formData.rule || ''}
            onChange={(e) => setFormData({ ...formData, rule: e.target.value })}
            helperText="Enter policy rule using the compliance DSL"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
} 