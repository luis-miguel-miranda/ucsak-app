import React from 'react';
import { Container, Typography, Paper } from '@mui/material';

function AboutView() {
  return (
    <Container>
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