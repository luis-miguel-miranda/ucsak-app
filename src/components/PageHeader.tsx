import React from 'react';
import { Box, Typography, SvgIconProps } from '@mui/material';

interface PageHeaderProps {
  icon: React.ReactElement<SvgIconProps>;
  title: string;
  subtitle?: string;
}

function PageHeader({ icon, title, subtitle }: PageHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3 }}>
      {React.cloneElement(icon, { 
        sx: { 
          fontSize: 56,
          mr: 2,
          color: 'text.secondary',
          mt: 0.5
        } 
      })}
      <Box>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default PageHeader; 