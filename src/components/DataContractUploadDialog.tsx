import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { useDropzone } from 'react-dropzone';

interface DataContractUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

export default function DataContractUploadDialog({ 
  open, 
  onClose,
  onUploadSuccess 
}: DataContractUploadDialogProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    if (file.type !== 'application/json') {
      setError('Please upload a JSON file');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/data-contracts/upload/odcs', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload contract');
      }

      onUploadSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload contract');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json']
    },
    multiple: false
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload ODCS v3 Data Contract</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            '&:hover': {
              bgcolor: 'action.hover'
            }
          }}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <CircularProgress size={24} />
          ) : (
            <>
              <Typography variant="body1" gutterBottom>
                {isDragActive
                  ? 'Drop the JSON file here'
                  : 'Drag and drop a JSON file here, or click to select'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Only ODCS v3 formatted JSON files are supported
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
} 