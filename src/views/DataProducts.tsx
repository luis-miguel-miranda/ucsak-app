import React, { useState, useEffect } from 'react';
import { DataProduct, ProductStatus, ProductType } from '../types/DataProduct';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function DataProducts() {
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
      setProducts([]);
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
      setStatuses([]);
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
      setProductTypes([]);
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
    if (!confirm('Are you sure you want to delete this data product?')) return;
    
    try {
      const response = await fetch(`/api/data-products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      await fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  };

  const handleSaveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const productData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      tags: (formData.get('tags') as string).split(',').map(tag => tag.trim()),
    };

    try {
      const url = selectedProduct 
        ? `/api/data-products/${selectedProduct.id}`
        : '/api/data-products';
      
      const response = await fetch(url, {
        method: selectedProduct ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) throw new Error('Failed to save product');
      setOpenDialog(false);
      await fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setError(err instanceof Error ? err.message : 'Failed to save product');
    }
  };

  const getStatusName = (statusId: string) => {
    const status = statuses.find(s => s.id === statusId);
    return status?.name || statusId;
  };

  return (
    <div className="container py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Data Products</h1>
        <Button onClick={handleCreateProduct} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Data Product
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border">
          {products.map((product) => (
            <div key={product.id} className="p-4 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">DP</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {getStatusName(product.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => product.id && handleDeleteProduct(product.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedProduct ? 'Edit Data Product' : 'Create Data Product'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={selectedProduct?.name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={selectedProduct?.description}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select name="type" defaultValue={selectedProduct?.type}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={selectedProduct?.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                defaultValue={selectedProduct?.tags?.join(', ')}
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedProduct ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 