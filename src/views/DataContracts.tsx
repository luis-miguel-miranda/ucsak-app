import React, { useState, useEffect } from 'react';
import { DataContract } from '../types/DataContract';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Plus, Pencil, Trash2, AlertCircle, FileText, Upload, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

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

  const handleDownloadContract = (contract: DataContract) => {
    const blob = new Blob([contract.contract_text], { 
      type: contract.format === 'json' 
        ? 'application/json' 
        : contract.format === 'yaml'
        ? 'application/x-yaml'
        : 'text/plain' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.name.toLowerCase().replace(/\s+/g, '_')}.${
      contract.format === 'yaml' ? 'yaml' : 
      contract.format === 'json' ? 'json' : 'txt'
    }`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      if (!file.type.startsWith('text/') && file.type !== 'application/json' && file.type !== 'application/x-yaml') {
        setUploadError('Please upload a text file (JSON, YAML, etc)');
        return;
      }

      try {
        setUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/data-contracts/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error('Failed to upload contract');
        }

        await fetchContracts();
        setOpenUploadDialog(false);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : 'Failed to upload contract');
      } finally {
        setUploading(false);
      }
    },
    accept: {
      'text/*': ['.json', '.yaml', '.yml', '.txt'],
      'application/json': ['.json'],
      'application/x-yaml': ['.yaml', '.yml']
    },
    multiple: false
  });

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
    <div className="container py-6">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-8 h-8" />
        Data Contracts
      </h1>
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <Button onClick={handleCreateContract} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Contract
          </Button>
          <Button onClick={() => setOpenUploadDialog(true)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Contract
          </Button>
        </div>
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
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>{contract.name}</TableCell>
                    <TableCell>{contract.version}</TableCell>
                    <TableCell>{contract.format}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(contract.created).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(contract.updated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(contract)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditContract(contract)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadContract(contract)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => contract.id && handleDeleteContract(contract.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
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
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="yaml">YAML</SelectItem>
                  <SelectItem value="text">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="deprecated">Deprecated</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
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
              <Label htmlFor="contractText">Contract Definition</Label>
              <textarea
                id="contractText"
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
                placeholder={format === 'yaml' ? 
                  `# Example contract in YAML format
name: Example Contract
version: 1.0
domain: example
datasets:
  - name: example_dataset
    type: table
    schema:
      columns:
        - name: id
          type: string
          description: Primary identifier` :
                  format === 'json' ?
                  `{
  "name": "Example Contract",
  "version": "1.0",
  "domain": "example",
  "datasets": [
    {
      "name": "example_dataset",
      "type": "table",
      "schema": {
        "columns": [
          {
            "name": "id",
            "type": "string",
            "description": "Primary identifier"
          }
        ]
      }
    }
  ]
}` : 
                  '# Enter your contract definition here'
                }
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

      {/* Details Dialog */}
      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contract Details</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <div className="space-y-4">
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
                <h4 className="font-semibold">Contract Definition</h4>
                <pre className="mt-2 whitespace-pre-wrap bg-muted p-4 rounded-md">
                  {selectedContract.contract_text}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Data Contract</DialogTitle>
          </DialogHeader>
          {uploadError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
              isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {isDragActive
                    ? 'Drop the file here'
                    : 'Drag and drop a contract file here, or click to select'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported formats: JSON, YAML, or plain text
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 