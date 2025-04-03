import React, { useEffect, useState } from 'react';
import { TreeView } from '../components/ui/tree-view';
import { Folder, FolderOpen, Table, Layout } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface CatalogItem {
  id: string;
  name: string;
  type: 'catalog' | 'schema' | 'table' | 'view';
  children: CatalogItem[];
  hasChildren: boolean;
}

interface TreeViewItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  children?: TreeViewItem[];
  onClick?: () => void;
  selected?: boolean;
}

const CatalogCommander: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);
  const [sourceItems, setSourceItems] = useState<CatalogItem[]>([]);
  const [targetItems, setTargetItems] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchCatalogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.info('Fetching catalogs from API');
      
      const response = await fetch('/api/catalogs', {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API response not OK: ${response.status} ${response.statusText}`);
        console.error(`Response body: ${errorText}`);
        throw new Error(`Failed to fetch catalogs: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error(`Unexpected content type: ${contentType}`);
        console.error(`Response body: ${errorText}`);
        throw new Error('Response is not JSON');
      }

      const data = await response.json();
      console.info(`Successfully fetched ${data.length} catalogs`);
      setSourceItems(data);
      setTargetItems(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch catalogs';
      console.error(`Error fetching catalogs: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (item: CatalogItem) => {
    setSelectedItems([item]);
  };

  const handleCopy = () => {
    setIsDialogOpen(true);
  };

  const handleMove = () => {
    setIsDialogOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'catalog':
        return <Folder className="h-4 w-4 text-blue-500" />;
      case 'schema':
        return <FolderOpen className="h-4 w-4 text-green-500" />;
      case 'table':
        return <Table className="h-4 w-4 text-orange-500" />;
      case 'view':
        return <Layout className="h-4 w-4 text-purple-500" />;
      default:
        return null;
    }
  };

  const renderTree = (items: CatalogItem[]): TreeViewItem[] => {
    return items.map(item => ({
      id: item.id,
      name: item.name,
      icon: getIcon(item.type),
      children: item.children ? renderTree(item.children) : [],
      onClick: () => handleItemSelect(item),
      selected: selectedItems.some(selected => selected.id === item.id)
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={fetchCatalogs}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Source</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mb-4"
            />
            <TreeView
              data={renderTree(sourceItems)}
              className="border rounded p-2"
              onSelectChange={(item) => handleItemSelect(item as unknown as CatalogItem)}
            />
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center gap-4">
          <Button onClick={handleCopy}>Copy →</Button>
          <Button onClick={handleMove}>Move →</Button>
        </div>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Target</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="mb-4"
            />
            <TreeView
              data={renderTree(targetItems)}
              className="border rounded p-2"
              onSelectChange={(item) => handleItemSelect(item as unknown as CatalogItem)}
            />
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Operation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedItems.length > 0
              ? `Selected items: ${selectedItems.map(item => item.name).join(', ')}`
              : 'No items selected'}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsDialogOpen(false)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CatalogCommander; 