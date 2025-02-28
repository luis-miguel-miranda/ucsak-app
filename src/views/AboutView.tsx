import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import PageHeader from '../components/PageHeader';
import HelpIcon from '@mui/icons-material/Help';

function AboutView() {
  return (
    <Container>
      <PageHeader
        icon={<HelpIcon />}
        title="About"
        subtitle="Learn more about this application"
      />
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>About Unity Catalog Swiss Army Knife</Typography>
        <Typography paragraph>
          This application provides comprehensive tools for managing Databricks Unity Catalog resources.
        </Typography>
        {/* Add more about information */}
      </Paper>
    </Container>
  );
}

export default AboutView; 