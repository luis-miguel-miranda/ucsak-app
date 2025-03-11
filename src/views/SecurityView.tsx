import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
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
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import PageHeader from '../components/PageHeader';

interface SecurityFeature {
  id: string;
  datasetId: string;
  datasetName: string;
  features: {
    envelopeEncryption: boolean;
    differentialPrivacy: boolean;
    columnEncryption: boolean;
    rowLevelSecurity: boolean;
  };
}

export default function SecurityView() {
  const [features, setFeatures] = useState<SecurityFeature[]>([
    {
      id: '1',
      datasetId: 'main.customers',
      datasetName: 'Customer Data',
      features: {
        envelopeEncryption: true,
        differentialPrivacy: false,
        columnEncryption: true,
        rowLevelSecurity: true,
      }
    }
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<SecurityFeature | null>(null);

  const handleEdit = (feature: SecurityFeature) => {
    setEditingFeature(feature);
    setDialogOpen(true);
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Security"
        subtitle="Manage advanced security features for your datasets"
        icon={<SecurityIcon />}
      />
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Button
          variant="contained"
          onClick={() => {
            setEditingFeature(null);
            setDialogOpen(true);
          }}
        >
          Add Security Features
        </Button>

        <List>
          {features.map((feature) => (
            <ListItem key={feature.id}>
              <ListItemText
                primary={feature.datasetName}
                secondary={
                  <React.Fragment>
                    {Object.entries(feature.features)
                      .filter(([_, enabled]) => enabled)
                      .map(([name]) => (
                        <Chip
                          key={name}
                          label={name.replace(/([A-Z])/g, ' $1').trim()}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      ))}
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleEdit(feature)}>
                  <EditIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>
          {editingFeature ? 'Edit Security Features' : 'Add Security Features'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Dataset"
            margin="normal"
            value={editingFeature?.datasetName || ''}
          />
          <FormGroup>
            <FormControlLabel
              control={<Checkbox />}
              label="Envelope Encryption"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Differential Privacy"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Column Encryption"
            />
            <FormControlLabel
              control={<Checkbox />}
              label="Row Level Security"
            />
          </FormGroup>
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