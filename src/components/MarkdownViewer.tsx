import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Paper, Typography } from '@mui/material';

interface MarkdownViewerProps {
  children: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ children }) => {
  return (
    <Paper elevation={0} sx={{ p: 2 }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <Typography variant="h4" gutterBottom>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h5" gutterBottom>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="h6" gutterBottom>
              {children}
            </Typography>
          ),
          p: ({ children }) => (
            <Typography variant="body1" paragraph>
              {children}
            </Typography>
          ),
          ul: ({ children }) => (
            <Typography component="ul" sx={{ pl: 2 }}>
              {children}
            </Typography>
          ),
          li: ({ children }) => (
            <Typography component="li">
              {children}
            </Typography>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </Paper>
  );
}; 