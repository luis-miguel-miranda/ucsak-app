import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Chip,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';
import CategoryIcon from '@mui/icons-material/Category';
import PageHeader from '../components/PageHeader';
import { DataProduct, ProductStatus, ProductType } from '../types/DataProduct';

function DataProductsView() {
  const [products, setProducts] = useState<DataProduct[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [productStatuses, setProductStatuses] = useState<string[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchStatuses();
    fetchTypes();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-products');
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      // Ensure each product has tags array
      const processedData = data.map((product: DataProduct) => ({
        ...product,
        tags: product.tags || [],
        input_ports: product.input_ports || [],
        output_ports: product.output_ports || []
      }));
      setProducts(processedData);
      setProductCount(processedData.length);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/data-products/statuses');
      if (!response.ok) throw new Error('Failed to fetch product statuses');
      const data = await response.json();
      setStatuses(data || []);
    } catch (err) {
      console.error('Error fetching product statuses:', err);
      setStatuses([]); // Set empty array on error
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch('/api/data-products/types');
      if (!response.ok) throw new Error('Failed to fetch product types');
      const data = await response.json();
      setProductTypes(data || []);
    } catch (err) {
      console.error('Error fetching product types:', err);
      setProductTypes([]); // Set empty array on error
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setOpenDialog(true);
  };

  const handleEditProduct = (product: DataProduct) => {
    setSelectedProduct(product);
    setOpenDialog(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this data product?')) return;
    
    try {
      const response = await fetch(`/api/data-products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleSaveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    
    const productData: DataProduct = {
      name: formData.get('name') as string,
      owner: formData.get('owner') as string,
      type: formData.get('type') as DataProduct['type'],
      status: formData.get('status') as DataProduct['status'],
      description: formData.get('description') as string,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(Boolean),
      input_ports: JSON.parse(formData.get('input_ports') as string || '[]'),
      output_ports: JSON.parse(formData.get('output_ports') as string || '[]'),
    };

    try {
      const url = selectedProduct 
        ? `/api/data-products/${selectedProduct.id}`
        : '/api/data-products';
        
      const response = await fetch(url, {
        method: selectedProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });
      
      if (!response.ok) throw new Error('Failed to save product');
      await fetchProducts();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  // Helper function to get status name from ID
  const getStatusName = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status ? status.name : statusId;
  };

  // Helper function to get status color
  const getStatusColor = (statusId: string) => {
    switch (statusId) {
      case 'published':
        return 'success';
      case 'draft':
        return 'default';
      case 'deprecated':
        return 'warning';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) return <Typography>Loading data products...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Container maxWidth="xl">
      <PageHeader
        title="Data Products"
        subtitle="Define and catalog your data products"
        icon={<CategoryIcon fontSize="large" />}
      />

      <Grid container spacing={2}>
        <Grid item xs={12} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateProduct}
          >
            Create Data Product
          </Button>
        </Grid>

        <Grid item xs={12}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
              <CircularProgress />
            </Box>
          ) : products.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No data products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Create your first data product to get started
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Owner</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Tags</TableCell>
                    <TableCell>Updated</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(products || []).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.owner}</TableCell>
                      <TableCell>{product.type}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusName(product.status)}
                          color={getStatusColor(product.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {(product.tags || []).map(tag => (
                          <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5 }} />
                        ))}
                      </TableCell>
                      <TableCell>
                        {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditProduct(product)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleDeleteProduct(product.id!)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Grid>
      </Grid>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveProduct}>
          <DialogTitle>
            {selectedProduct ? 'Edit Data Product' : 'Create Data Product'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                name="name"
                label="Product Name"
                defaultValue={selectedProduct?.name}
                required
                fullWidth
              />
              <TextField
                name="owner"
                label="Owner"
                defaultValue={selectedProduct?.owner}
                required
                fullWidth
              />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      name="type"
                      defaultValue={selectedProduct?.type || ''}
                      label="Type"
                      required
                    >
                      {productTypes.map(type => (
                        <MenuItem key={type.id} value={type.id}>
                          {type.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      name="status"
                      defaultValue={selectedProduct?.status || ''}
                      label="Status"
                      required
                    >
                      {productStatuses.map(status => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <TextField
                name="description"
                label="Description"
                defaultValue={selectedProduct?.description}
                multiline
                rows={3}
                fullWidth
              />
              <TextField
                name="tags"
                label="Tags (comma-separated)"
                defaultValue={selectedProduct?.tags.join(', ')}
                fullWidth
              />
              <TextField
                name="input_ports"
                label="Input Ports (JSON)"
                defaultValue={JSON.stringify(selectedProduct?.input_ports || [], null, 2)}
                multiline
                rows={4}
                fullWidth
              />
              <TextField
                name="output_ports"
                label="Output Ports (JSON)"
                defaultValue={JSON.stringify(selectedProduct?.output_ports || [], null, 2)}
                multiline
                rows={4}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default DataProductsView; 