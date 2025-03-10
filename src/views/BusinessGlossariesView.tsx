import React, { useState, useEffect } from 'react';
import { RichTreeView } from '@mui/x-tree-view/RichTreeView';
import { TreeItem2 } from '@mui/x-tree-view/TreeItem2';
import { Paper, Box, Typography, Chip, List, ListItem, Stack, Divider, Tabs, Tab, Container } from '@mui/material';
import { SearchBox } from '../components/SearchBox';
import { MarkdownViewer } from '../components/MarkdownViewer';
import { Button, ButtonGroup } from '../components/Button';
import { useApi } from '../hooks/useApi';
import { format } from 'date-fns';
import { BusinessGlossary, GlossaryTerm } from '../types/BusinessGlossaries';
import ReactFlow, { Node, Edge, Background, MarkerType, Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import PageHeader from '../components/PageHeader';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface InfoPanelProps {
  metadata: BusinessGlossary | GlossaryTerm;
  type: 'glossary' | 'term';
}

const InfoPanel: React.FC<InfoPanelProps> = ({ metadata, type }) => {
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), 'PPP p');
  };

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <Box sx={{ mb: 2 }}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Box>
  );

  return (
    <Stack spacing={2}>
      <Typography variant="h6" gutterBottom>
        Details
      </Typography>

      <DetailItem label="Owner" value={metadata.owner} />
      <DetailItem label="Status" value={metadata.status} />
      <DetailItem label="Domain" value={metadata.domain} />

      {type === 'glossary' && (
        <>
          <DetailItem label="Scope" value={(metadata as BusinessGlossary).scope} />
          <DetailItem label="Org Unit" value={(metadata as BusinessGlossary).org_unit} />
        </>
      )}

      {(metadata as GlossaryTerm).abbreviation && (
        <DetailItem
          label="Abbreviation"
          value={(metadata as GlossaryTerm).abbreviation}
        />
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Tags
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {metadata.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ m: 0.5 }}
            />
          ))}
        </Stack>
      </Box>

      {(metadata as GlossaryTerm).examples?.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Examples
          </Typography>
          <List dense disablePadding>
            {(metadata as GlossaryTerm).examples.map((example, index) => (
              <ListItem key={index} sx={{ pl: 1 }}>
                <Typography variant="body2">• {example}</Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Divider />

      <DetailItem
        label="Created"
        value={formatDate(metadata.created_at)}
      />
      <DetailItem
        label="Last Updated"
        value={formatDate(metadata.updated_at)}
      />
    </Stack>
  );
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BusinessGlossariesView: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [glossaries, setGlossaries] = useState<BusinessGlossary[]>([]);
  const api = useApi();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    loadGlossaries();
  }, []);

  const loadGlossaries = async () => {
    const response = await api.get<{ glossaries: BusinessGlossary[] }>('/api/business-glossaries');
    setGlossaries(response.data.glossaries || []);
  };

  const getSelectedItem = () => {
    if (!selectedId) return null;

    for (const glossary of glossaries) {
      if (glossary.id === selectedId) {
        return { type: 'glossary' as const, metadata: glossary };
      }
      const term = glossary.terms[selectedId];
      if (term) {
        return { type: 'term' as const, metadata: term };
      }
    }
    return null;
  };

  const renderTree = (glossary: BusinessGlossary) => (
    <TreeItem2
      key={glossary.id}
      itemId={glossary.id}
      label={glossary.name}
    >
      {Object.values(glossary.terms).map((term) => (
        <TreeItem2
          key={term.id}
          itemId={term.id}
          label={term.name}
        />
      ))}
    </TreeItem2>
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here
  };

  const handleNewClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNewClose = () => {
    setAnchorEl(null);
  };

  const handleCreateGlossary = () => {
    handleNewClose();
    // Implement create glossary dialog
  };

  const handleCreateTerm = () => {
    handleNewClose();
    // Implement create term dialog
  };

  const handleUpdate = () => {
    if (!selectedItem) return;
    // Implement update dialog based on selectedItem.type
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    const itemType = selectedItem.type === 'glossary' ? 'glossary' : 'term';
    if (window.confirm(`Are you sure you want to delete this ${itemType}?`)) {
      if (selectedItem.type === 'glossary') {
        await api.delete(`/api/business-glossaries/${selectedItem.metadata.id}`);
      } else {
        await api.delete(`/api/business-glossaries/${selectedItem.metadata.source_glossary_id}/terms/${selectedItem.metadata.id}`);
      }
      loadGlossaries();
    }
  };

  const selectedItem = getSelectedItem();

  const isGlossary = (item: BusinessGlossary | GlossaryTerm): item is BusinessGlossary => {
    return (item as BusinessGlossary).description !== undefined;
  };

  const renderTaggedItems = (metadata: BusinessGlossary | GlossaryTerm) => {
    const taggedAssets = metadata.taggedAssets || [];
    return (
      <List>
        {taggedAssets.map((asset) => (
          <ListItem 
            key={asset.id}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              '&:last-child': { borderBottom: 0 }
            }}
          >
            <Box>
              <Typography variant="subtitle1">
                {asset.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {asset.type} • {asset.path}
              </Typography>
            </Box>
          </ListItem>
        ))}
        {taggedAssets.length === 0 && (
          <Typography color="text.secondary" sx={{ p: 2 }}>
            No tagged items found
          </Typography>
        )}
      </List>
    );
  };

  const renderLineage = (metadata: BusinessGlossary | GlossaryTerm) => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add current item as center node
    nodes.push({
      id: metadata.id,
      data: { label: metadata.name },
      position: { x: 250, y: 200 },
      type: 'default',
      style: { 
        background: '#fff',
        border: '2px solid #1976d2',
        borderRadius: '4px',
        padding: '8px',
        fontSize: '12px',
        width: 150,
        textAlign: 'center'
      }
    });

    // Add parent glossaries as upstream nodes
    if ('source_glossary_id' in metadata) {
      const parentGlossary = glossaries.find(g => g.id === metadata.source_glossary_id);
      if (parentGlossary) {
        nodes.push({
          id: parentGlossary.id,
          data: { label: parentGlossary.name },
          position: { x: 250, y: 50 },
          type: 'default',
          style: { 
            background: '#e3f2fd',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px',
            width: 150,
            textAlign: 'center'
          }
        });
        edges.push({
          id: `${parentGlossary.id}-${metadata.id}`,
          source: parentGlossary.id,
          target: metadata.id,
          type: 'smoothstep'
        });
      }
    } else {
      // For glossaries, show parent glossaries
      const glossary = metadata as BusinessGlossary;
      glossary.parent_glossary_ids.forEach((parentId, index) => {
        const parent = glossaries.find(g => g.id === parentId);
        if (parent) {
          nodes.push({
            id: parent.id,
            data: { label: parent.name },
            position: { x: 150 + (index * 200), y: 50 },
            type: 'default',
            style: { 
              background: '#e3f2fd',
              borderRadius: '8px',
              padding: '10px'
            }
          });
          edges.push({
            id: `${parent.id}-${metadata.id}`,
            source: parent.id,
            target: metadata.id,
            type: 'smoothstep'
          });
        }
      });
    }

    // Add tagged assets as downstream nodes
    const taggedAssets = metadata.taggedAssets || [];
    taggedAssets.forEach((asset, index) => {
      nodes.push({
        id: asset.id,
        data: { 
          label: (
            <Box sx={{ fontSize: '12px' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '10px' }}>
                {asset.type}
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '12px' }}>
                {asset.name}
              </Typography>
            </Box>
          )
        },
        position: { x: 100 + (index * 175), y: 350 },
        type: 'default',
        style: { 
          background: '#f5f5f5',
          borderRadius: '4px',
          padding: '6px',
          width: 150,
          textAlign: 'center'
        }
      });
      edges.push({
        id: `${metadata.id}-${asset.id}`,
        source: metadata.id,
        target: asset.id,
        type: 'smoothstep'
      });
    });

    return (
      <Box sx={{ height: 500, border: 1, borderColor: 'divider', borderRadius: 1 }}>
        <ReactFlow 
          nodes={nodes} 
          edges={edges}
          fitView
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          minZoom={0.5}
          maxZoom={1.5}
          style={{ background: '#F7F9FB' }}
          defaultEdgeOptions={{
            style: { strokeWidth: 1.5 },
            markerEnd: { type: MarkerType.ArrowClosed }
          }}
        >
          <Controls />
          <Background  />
        </ReactFlow>
      </Box>
    );
  };

  return (
    <Container maxWidth="xl">
      <PageHeader
        icon={<MenuBookIcon />}
        title="Business Glossaries"
        subtitle="Manage business terms and definitions"
      />
      {/* Controls Row */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <SearchBox
          placeholder="Search glossaries and terms..."
          value={searchQuery}
          onChange={handleSearch}
        />
        <ButtonGroup>
          <Button onClick={() => handleNewClick}>New</Button>
          <Button
            aria-haspopup="menu"
            onClick={() => handleNewClick}
          >
            <ArrowDropDownIcon />
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={!selectedId}
          >
            Update
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!selectedId}
            variant="danger"
          >
            Delete
          </Button>
        </ButtonGroup>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleNewClose}
        >
          <MenuItem onClick={handleCreateGlossary}>
            New Glossary
          </MenuItem>
          <MenuItem onClick={handleCreateTerm}>
            New Term
          </MenuItem>
        </Menu>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* Left Panel - Tree View */}
        <Paper elevation={3} sx={{ width: '25%' }}>
          <RichTreeView
            aria-label="glossary navigator"
            defaultExpandedItems={['root']}
            selectedItems={selectedId || ''}
            onSelectedItemsChange={(event, itemId) => setSelectedId(itemId)}
            items={glossaries.map(glossary => ({
              id: glossary.id,
              label: glossary.name,
              children: Object.values(glossary.terms).map(term => ({
                id: term.id,
                label: term.name
              }))
            }))}
          >
            {glossaries.map(renderTree)}
          </RichTreeView>
        </Paper>

        {/* Center Panel - Content */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '50%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {selectedItem && (
            <>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h5">
                  {selectedItem.metadata.name}
                </Typography>
              </Box>
              
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={(e, newValue) => setActiveTab(newValue)}
                >
                  <Tab label="Description" />
                  <Tab label="Tagged Items" />
                  <Tab label="Lineage" />
                </Tabs>
              </Box>

              <TabPanel value={activeTab} index={0}>
                <MarkdownViewer>
                  {isGlossary(selectedItem.metadata) 
                    ? selectedItem.metadata.description
                    : selectedItem.metadata.definition
                  }
                </MarkdownViewer>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {renderTaggedItems(selectedItem.metadata)}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderLineage(selectedItem.metadata)}
              </TabPanel>
            </>
          )}
        </Paper>

        {/* Right Panel - Info */}
        <Paper 
          elevation={3} 
          sx={{ 
            width: '25%',
            p: 2
          }}
        >
          {selectedItem && (
            <InfoPanel
              metadata={selectedItem.metadata}
              type={selectedItem.type}
            />
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default BusinessGlossariesView; 