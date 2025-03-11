import React, { useState } from 'react';
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
}

export default function ComplianceView() {
  const [policies, setPolicies] = useState<CompliancePolicy[]>([
    {
      id: '1',
      name: 'PII Data Encryption',
      description: 'Ensure all PII data is encrypted at rest',
      rule: 'MATCH (d:Dataset) WHERE d.contains_pii = true ASSERT d.encryption = "AES256"',
      compliance: 85,
      history: [70, 75, 80, 82, 85]
    }
  ]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<CompliancePolicy | null>(null);

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
                85%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Active Policies</Typography>
              <Typography variant="h3" color="primary">
                {policies.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Critical Issues</Typography>
              <Typography variant="h3" color="error">
                2
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
                  setDialogOpen(true);
                }}>
                  <EditIcon />
                </IconButton>
                <IconButton>
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
            value={editingPolicy?.name || ''}
          />
          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={2}
            value={editingPolicy?.description || ''}
          />
          <TextField
            fullWidth
            label="Policy Rule"
            margin="normal"
            multiline
            rows={4}
            value={editingPolicy?.rule || ''}
            helperText="Enter policy rule using the compliance DSL"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setDialogOpen(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
} 