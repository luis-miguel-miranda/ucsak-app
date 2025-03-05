import React from 'react';
import { Container, Paper, Typography, Box, Link, Divider, Grid } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoIcon from '@mui/icons-material/Info';
import PageHeader from '../components/PageHeader';

function AboutView() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <PageHeader 
        icon={<InfoIcon />} 
        title="About" 
        subtitle="Information about the Unity Catalog Swiss Army Knife" 
      />
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Unity Catalog Swiss Army Knife
        </Typography>
        <Typography variant="body1" paragraph>
          A comprehensive tool for managing Databricks Unity Catalog resources, featuring a React frontend and Flask backend.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Source Code
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <GitHubIcon sx={{ mr: 1 }} />
          <Link 
            href="https://github.com/larsgeorge/ucsak-app" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            https://github.com/larsgeorge/ucsak-app
          </Link>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Features
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Data Management</Typography>
            <ul>
              <li>Data Products management</li>
              <li>Data Contracts handling</li>
              <li>Business Glossaries</li>
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Access Control</Typography>
            <ul>
              <li>Entitlements management</li>
              <li>Persona-based access control</li>
              <li>Unity Catalog security integration</li>
            </ul>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Technology Stack
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Frontend</Typography>
            <ul>
              <li>React with TypeScript</li>
              <li>Material UI components</li>
              <li>React Router for navigation</li>
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Backend</Typography>
            <ul>
              <li>Python with Flask</li>
              <li>Databricks SDK integration</li>
              <li>RESTful API architecture</li>
            </ul>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default AboutView; 