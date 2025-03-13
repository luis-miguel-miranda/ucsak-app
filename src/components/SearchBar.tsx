import React, { useState, useEffect, useRef } from 'react';
import { 
  TextField, 
  InputAdornment, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Popper,
  ClickAwayListener,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  type: string;
  link: string;
}

interface SearchResults {
  notifications: SearchResult[];
  terms: SearchResult[];
  contracts: SearchResult[];
  products: SearchResult[];
}

interface SearchBarProps {
  variant?: 'large' | 'compact';
  placeholder?: string;
  width?: string | number;
}

export default function SearchBar({ 
  variant = 'compact', 
  placeholder = 'Search...',
  width = 300
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>({
    notifications: [],
    terms: [],
    contracts: [],
    products: []
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        searchData();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const searchData = async () => {
    if (!query) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
      setOpen(true);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (link: string) => {
    navigate(link);
    setOpen(false);
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'notification':
        return <NotificationsIcon color="info" />;
      case 'term':
        return <MenuBookIcon color="primary" />;
      case 'contract':
        return <DescriptionIcon color="secondary" />;
      case 'product':
        return <CategoryIcon color="success" />;
      default:
        return <SearchIcon />;
    }
  };

  const hasResults = Object.values(results).some(group => group.length > 0);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box ref={anchorRef} sx={{ width: variant === 'large' ? '100%' : width }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          variant={variant === 'large' ? "outlined" : "standard"}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
            sx: {
              borderRadius: variant === 'large' ? 28 : 0,
              bgcolor: variant === 'large' ? 'background.paper' : 'transparent',
              color: variant === 'large' ? 'text.primary' : 'white',
              '& .MuiInputBase-input': {
                py: variant === 'large' ? 1.5 : 1,
              },
              '& .MuiSvgIcon-root': {
                color: variant === 'large' ? 'action.active' : 'white',
              }
            }
          }}
          sx={{
            boxShadow: variant === 'large' ? 3 : 0,
            '& .MuiOutlinedInput-root': {
              borderRadius: variant === 'large' ? 28 : 0,
              '& fieldset': {
                border: variant === 'large' ? 'none' : undefined,
              },
              '&:hover fieldset': {
                border: variant === 'large' ? 'none' : undefined,
              },
              '&.Mui-focused fieldset': {
                border: variant === 'large' ? 'none' : undefined,
              },
            },
            '& .MuiInput-underline:before': {
              borderBottomColor: variant === 'compact' ? 'rgba(255, 255, 255, 0.7)' : undefined,
            },
            '& .MuiInput-underline:hover:before': {
              borderBottomColor: variant === 'compact' ? 'white' : undefined,
            },
          }}
        />

        <Popper
          open={open && query.length >= 2}
          anchorEl={anchorRef.current}
          placement="bottom-start"
          style={{ width: anchorRef.current?.clientWidth, zIndex: 1300 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              mt: 1, 
              maxHeight: 400, 
              overflow: 'auto',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            {!hasResults ? (
              <Box p={2} textAlign="center">
                <Typography color="text.secondary">No results found</Typography>
              </Box>
            ) : (
              <List dense>
                {results.notifications.length > 0 && (
                  <>
                    <ListItem sx={{ bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Notifications
                      </Typography>
                    </ListItem>
                    {results.notifications.map(result => (
                      <ListItem 
                        key={result.id}
                        onClick={() => handleResultClick(result.link)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getIcon(result.type)}
                        </ListItemIcon>
                        <ListItemText primary={result.title} />
                      </ListItem>
                    ))}
                    <Divider />
                  </>
                )}

                {results.terms.length > 0 && (
                  <>
                    <ListItem sx={{ bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Business Terms
                      </Typography>
                    </ListItem>
                    {results.terms.map(result => (
                      <ListItem 
                        key={result.id}
                        onClick={() => handleResultClick(result.link)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getIcon(result.type)}
                        </ListItemIcon>
                        <ListItemText primary={result.title} />
                      </ListItem>
                    ))}
                    <Divider />
                  </>
                )}

                {results.contracts.length > 0 && (
                  <>
                    <ListItem sx={{ bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data Contracts
                      </Typography>
                    </ListItem>
                    {results.contracts.map(result => (
                      <ListItem 
                        key={result.id}
                        onClick={() => handleResultClick(result.link)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getIcon(result.type)}
                        </ListItemIcon>
                        <ListItemText primary={result.title} />
                      </ListItem>
                    ))}
                    <Divider />
                  </>
                )}

                {results.products.length > 0 && (
                  <>
                    <ListItem sx={{ bgcolor: 'action.hover' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data Products
                      </Typography>
                    </ListItem>
                    {results.products.map(result => (
                      <ListItem 
                        key={result.id}
                        onClick={() => handleResultClick(result.link)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {getIcon(result.type)}
                        </ListItemIcon>
                        <ListItemText primary={result.title} />
                      </ListItem>
                    ))}
                  </>
                )}
              </List>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
} 