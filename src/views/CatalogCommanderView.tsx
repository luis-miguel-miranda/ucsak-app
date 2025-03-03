import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Grid,
  Typography,
  ButtonGroup,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  LinearProgress,
} from '@mui/material';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem2 } from '@mui/x-tree-view/TreeItem2';
import DeleteIcon from '@mui/icons-material/Delete';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import StorageIcon from '@mui/icons-material/Storage';
import DatabaseIcon from '@mui/icons-material/Storage';
import TableViewIcon from '@mui/icons-material/TableView';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CommandIcon from '@mui/icons-material/Code';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PageHeader from '../components/PageHeader';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

interface CatalogItem {
  id: string;
  name: string;
  type: 'catalog' | 'schema' | 'table' | 'view';
  children: CatalogItem[];  // Always an array, empty means no children fetched yet
  hasChildren?: boolean;    // Flag to indicate if node can have children
}

function CustomTreeItem(props: any) {
  const { type } = props;
  
  const getIcon = () => {
    switch (type) {
      case 'catalog':
        return <StorageIcon sx={{ color: 'text.secondary' }} />;
      case 'schema':
        return <DatabaseIcon sx={{ color: 'text.secondary' }} />;
      case 'table':
        return <TableViewIcon sx={{ color: 'text.secondary' }} />;
      case 'view':
        return <ViewColumnIcon sx={{ color: 'text.secondary' }} />;
      default:
        return null;
    }
  };

  return (
    <TreeItem2
      {...props}
      ContentProps={{
        ...props.ContentProps,
        startIcon: getIcon()
      }}
    />
  );
}

function CatalogCommanderView() {
  const [selectedLeft, setSelectedLeft] = useState<string[]>([]);
  const [selectedRight, setSelectedRight] = useState<string[]>([]);
  const [expandedLeft, setExpandedLeft] = useState<string[]>([]);
  const [expandedRight, setExpandedRight] = useState<string[]>([]);
  const [selectedObjectInfo, setSelectedObjectInfo] = useState<any>(null);
  const [catalogData, setCatalogData] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [datasetContent, setDatasetContent] = useState<{
    schema: Array<{ name: string; type: string; nullable: boolean }>;
    data: any[];
    total_rows: number;
  } | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 25,
    page: 0
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const response = await fetch('/api/catalogs');
        if (!response.ok) {
          throw new Error('Failed to fetch catalogs');
        }
        const data = await response.json();
        // Add a fake child node to each catalog to show expand icon
        const catalogsWithChildren = data.map((catalog: CatalogItem) => ({
          ...catalog,
          children: [{
            id: `${catalog.id}_placeholder`,
            name: '',
            type: 'schema',
            children: []
          }]
        }));
        setCatalogData(catalogsWithChildren);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogs();
  }, []);

  const fetchChildren = async (nodeId: string, nodeType: string): Promise<CatalogItem[]> => {
    if (nodeType === 'catalog') {
      const response = await fetch(`/api/catalogs/${nodeId}/schemas`);
      if (!response.ok) throw new Error('Failed to fetch schemas');
      const schemas = await response.json();
      // Add fake nodes to schemas
      return schemas.map((schema: CatalogItem) => ({
        ...schema,
        children: [{
          id: `${schema.id}_placeholder`,
          name: '',
          type: 'table',
          children: []
        }]
      }));
    } else if (nodeType === 'schema') {
      const [catalogName, schemaName] = nodeId.split('.');
      const response = await fetch(`/api/catalogs/${catalogName}/schemas/${schemaName}/tables`);
      if (!response.ok) throw new Error('Failed to fetch tables');
      const tables = await response.json();
      // Tables are leaf nodes, no need for fake children
      return tables;
    }
    return [];
  };

  const handleNodeExpand = async (nodeIds: string[]) => {
    const newExpandedIds = nodeIds.filter(id => !expandedLeft.includes(id));
    
    for (const nodeId of newExpandedIds) {
      const node = findNode(catalogData, nodeId);
      // Check if node has only the placeholder child
      if (node && node.children.length === 1 && node.children[0].name === '') {
        try {
          setLoadingNodes(prev => new Set(prev).add(nodeId));
          const children = await fetchChildren(node.id, node.type);
          updateNodeChildren(nodeId, children);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load children');
        } finally {
          setLoadingNodes(prev => {
            const next = new Set(prev);
            next.delete(nodeId);
            return next;
          });
        }
      }
    }
    setExpandedLeft(nodeIds);
  };

  // Helper function to find a node in the tree
  const findNode = (items: CatalogItem[], id: string): CatalogItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findNode(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper function to update node children in the tree
  const updateNodeChildren = (nodeId: string, children: CatalogItem[]) => {
    setCatalogData(prevData => {
      const updateNode = (items: CatalogItem[]): CatalogItem[] => {
        return items.map(item => {
          if (item.id === nodeId) {
            return { ...item, children };
          }
          if (item.children) {
            return { ...item, children: updateNode(item.children) };
          }
          return item;
        });
      };
      return updateNode([...prevData]);
    });
  };

  const handleOperation = (operation: string) => {
    // Implement operations here
    console.log(`${operation} operation triggered`);
  };

  const handleViewDataset = async (path: string) => {
    setSelectedDataset(path);
    setLoadingData(true);
    setViewDialogOpen(true);

    try {
      const response = await fetch(`/api/catalogs/dataset/${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to fetch dataset');
      const data = await response.json();
      setDatasetContent(data);
    } catch (err) {
      console.error('Error loading dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setLoadingData(false);
    }
  };

  const renderTreeContent = () => {
    if (loading) {
      return <Typography>Loading catalogs...</Typography>;
    }
    if (error) {
      return <Typography color="error">{error}</Typography>;
    }
    return (
      <RichTreeView
        items={catalogData}
        getItemLabel={(item) => (
            loadingNodes.has(item.id) 
            ? `${item.name} (loading...)`
            : item.name
        )}
        slots={{
          item: CustomTreeItem,
          collapseIcon: ExpandMoreIcon,
          expandIcon: ChevronRightIcon,
        }}
        selectedItems={selectedLeft}
        onSelectedItemsChange={(event, items) => {
          setSelectedLeft(items);
          if (items.length > 0) {
            setSelectedObjectInfo({ id: items[0], side: 'left' });
          }
        }}
        expandedItems={expandedLeft}
        onExpandedItemsChange={(event, items) => handleNodeExpand(items)}
        multiSelect
        aria-label="Source catalog browser"
      />
    );
  };

  // Add this helper function to get the selected node's details
  const getSelectedNodeDetails = () => {
    if (!selectedObjectInfo) return null;
    const node = findNode(catalogData, selectedObjectInfo.id);
    return node;
  };

  const renderActions = () => (
    <>
      <Button
        startIcon={<VisibilityIcon />}
        onClick={() => handleViewDataset(getSelectedNodeDetails()?.id || '')}
        disabled={!selectedLeft.length || getSelectedNodeDetails()?.type !== 'table'}
      >
        View
      </Button>
      <Button
        startIcon={<DriveFileMoveIcon />}
        onClick={() => handleOperation('move')}
      >
        Move
      </Button>
      <Button
        startIcon={<DeleteIcon />}
        onClick={() => handleOperation('delete')}
        color="error"
      >
        Delete
      </Button>
      <Button
        startIcon={<EditIcon />}
        onClick={() => handleOperation('rename')}
      >
        Rename
      </Button>
      <Button
        startIcon={<InfoIcon />}
        onClick={() => handleOperation('info')}
      >
        Info
      </Button>
    </>
  );

  // Add the dataset viewer dialog
  const DatasetViewerDialog = () => {
    if (!datasetContent) return null;

    const columns: GridColDef[] = datasetContent.schema.map(col => ({
      field: col.name,
      headerName: `${col.name} (${col.type})`,
      flex: 1,
      minWidth: 150,
    }));

    return (
      <Dialog 
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle>
          Dataset View: {selectedDataset}
          {loadingData && <LinearProgress sx={{ mt: 1 }} />}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ height: 600, width: '100%', mt: 2 }}>
            <DataGrid
              rows={datasetContent.data.map((row, index) => ({ id: index, ...row }))}
              columns={columns}
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[25]}
              disableRowSelectionOnClick
              density="compact"
              loading={loadingData}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        icon={<CommandIcon />}
        title="Catalog Commander"
        subtitle="Advanced catalog management tools"
      />
      <Grid container spacing={2}>
        {/* Command Buttons */}
        <Grid item xs={12}>
          <ButtonGroup 
            variant="contained" 
            sx={{ mb: 2, '& > button': { mx: 0.5 } }}
          >
            {renderActions()}
          </ButtonGroup>
        </Grid>

        {/* Browser Panes */}
        <Grid item xs={true}>
          <Paper sx={{ p: 2, height: '60vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Source
            </Typography>
            {renderTreeContent()}
          </Paper>
        </Grid>

        {/* Transfer Controls */}
        <Grid item xs="auto" sx={{ display: 'flex', alignItems: 'center' }}>
          <ButtonGroup
            orientation="vertical"
            variant="contained"
            sx={{ mt: -4 }}
          >
            <Button
              onClick={(e) => {
                const operation = e.shiftKey ? 'move' : 'copy';
                handleOperation(operation);
              }}
              title="Click to copy, Shift+Click to move"
            >
              →
            </Button>
            <Button
              onClick={(e) => {
                const operation = e.shiftKey ? 'move' : 'copy';
                handleOperation(operation);
              }}
              title="Click to copy, Shift+Click to move"
            >
              ←
            </Button>
          </ButtonGroup>
        </Grid>

        <Grid item xs={true}>
          <Paper sx={{ p: 2, height: '60vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Target
            </Typography>
            <RichTreeView
              items={catalogData}
              getItemLabel={(item) => (
                loadingNodes.has(item.id) 
                ? `${item.name} (loading...)`
                : item.name
              )}
              slots={{
                item: CustomTreeItem,
                collapseIcon: ExpandMoreIcon,
                expandIcon: ChevronRightIcon,
              }}
              selectedItems={selectedRight}
              onSelectedItemsChange={(event, items) => {
                setSelectedRight(items);
                if (items.length > 0) {
                  setSelectedObjectInfo({ id: items[0], side: 'right' });
                }
              }}
              expandedItems={expandedRight}
              onExpandedItemsChange={(event, items) => setExpandedRight(items)}
              multiSelect
              aria-label="Target catalog browser"
            />
          </Paper>
        </Grid>

        {/* Info Panel */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, minHeight: '20vh' }}>
            <Typography variant="h6" gutterBottom>
              Object Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {selectedObjectInfo ? (
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Basic Information</Typography>
                  {(() => {
                    const node = getSelectedNodeDetails();
                    return node ? (
                      <>
                        <Typography variant="body2">
                          Name: {node.name}
                        </Typography>
                        <Typography variant="body2">
                          Type: {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                        </Typography>
                        <Typography variant="body2">
                          Full Path: {node.id}
                        </Typography>
                        <Typography variant="body2">
                          Location: {selectedObjectInfo.side} pane
                        </Typography>
                      </>
                    ) : (
                      <Typography color="text.secondary">
                        Loading details...
                      </Typography>
                    );
                  })()}
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Properties</Typography>
                  {/* We can add more specific properties based on the node type later */}
                </Grid>
              </Grid>
            ) : (
              <Typography color="text.secondary">
                Select an object to view its information
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
      <DatasetViewerDialog />
    </Container>
  );
}

export default CatalogCommanderView; 