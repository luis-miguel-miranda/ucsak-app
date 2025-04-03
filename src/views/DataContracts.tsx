import React, { useState, useEffect } from 'react';
import { DataContract } from '../types/DataContract';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Plus, Pencil, Trash2, AlertCircle, FileText } from 'lucide-react';

export default function DataContracts() {
  const [contracts, setContracts] = useState<DataContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState<DataContract | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0');
  const [status, setStatus] = useState('draft');
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [contractText, setContractText] = useState('');
  const [format, setFormat] = useState('json');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/data-contracts');
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      setContracts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contracts');
    } finally {
      setLoading(false);
    }
  };

  const fetchContract = async (id: string) => {
    try {
      const response = await fetch(`/api/data-contracts/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contract');
      const data = await response.json();
      setSelectedContract(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contract');
    }
  };

  const createContract = async (formData: any) => {
    try {
      const response = await fetch('/api/data-contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to create contract');
      await fetchContracts();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create contract');
    }
  };

  const updateContract = async (id: string, formData: any) => {
    try {
      const response = await fetch(`/api/data-contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to update contract');
      await fetchContracts();
      setOpenDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update contract');
    }
  };

  const deleteContract = async (id: string) => {
    try {
      const response = await fetch(`/api/data-contracts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contract');
      await fetchContracts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contract');
    }
  };

  const handleCreateContract = () => {
    setSelectedContract(null);
    setName('');
    setVersion('1.0');
    setStatus('draft');
    setOwner('');
    setDescription('');
    setContractText('');
    setOpenDialog(true);
  };

  const handleEditContract = async (contract: DataContract) => {
    setSelectedContract(contract);
    setName(contract.name);
    setVersion(contract.version);
    setStatus(contract.status);
    setOwner(contract.owner);
    setDescription(contract.description || '');
    setContractText(contract.contract_text);
    setOpenDialog(true);
  };

  const handleDeleteContract = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contract?')) return;
    await deleteContract(id);
  };

  const handleSaveContract = async (event: React.FormEvent) => {
    event.preventDefault();
    const formData = {
      name,
      version,
      status,
      owner,
      description,
      contract_text: contractText,
      format,
      dataProducts: [], // Initialize with empty array
      schema: {
        fields: [] // Initialize with empty array
      },
      validation_rules: [] // Initialize with empty array
    };

    if (selectedContract?.id) {
      await updateContract(selectedContract.id, formData);
    } else {
      await createContract(formData);
    }
  };

  const handleViewDetails = async (contract: DataContract) => {
    if (contract.id) {
      await fetchContract(contract.id);
      setOpenDetails(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Data Contracts</h1>
        <div className="flex space-x-2">
          <Button onClick={handleCreateContract}>
            <Plus className="h-4 w-4 mr-2" />
            Create Contract
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No contracts found. Create your first contract to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          {contracts.map((contract) => (
            <div key={contract.id} className="p-4 border-b last:border-b-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold">DC</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{contract.name}</h3>
                    <p className="text-sm text-muted-foreground">{contract.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(contract.status)}>
                    {contract.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(contract)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditContract(contract)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => contract.id && handleDeleteContract(contract.id)}
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
              {selectedContract ? 'Edit Data Contract' : 'Create Data Contract'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveContract} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">Version</Label>
              <Input
                id="version"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input
                id="owner"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractText">Contract Text</Label>
              <textarea
                id="contractText"
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedContract ? 'Update' : 'Create'} Contract
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedContract && (
              <>
                <div>
                  <h4 className="font-semibold">Name</h4>
                  <p>{selectedContract.name}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Version</h4>
                  <p>{selectedContract.version}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Status</h4>
                  <Badge variant="outline" className={getStatusColor(selectedContract.status)}>
                    {selectedContract.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold">Owner</h4>
                  <p>{selectedContract.owner}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Description</h4>
                  <p>{selectedContract.description || 'No description provided'}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Contract Text</h4>
                  <pre className="mt-2 whitespace-pre-wrap bg-muted p-4 rounded-md">
                    {selectedContract.contract_text}
                  </pre>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 