import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  useMediaQuery,
  useTheme,
  Tooltip,
  Badge,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import GavelIcon from '@mui/icons-material/Gavel';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';
import NotificationsIcon from '@mui/icons-material/Notifications';

const drawerWidth = 240;
const collapsedDrawerWidth = 64;

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Data Products', icon: <CategoryIcon />, path: '/data-products' },
    { text: 'Data Contracts', icon: <DescriptionIcon />, path: '/data-contracts' },
    { text: 'Business Glossary', icon: <MenuBookIcon />, path: '/business-glossary' },
    { text: 'Master Data Management', icon: <CompareArrowsIcon />, path: '/master-data' },
    { text: 'Entitlements', icon: <ManageAccountsIcon />, path: '/entitlements' },
    { text: 'Security', icon: <SecurityIcon />, path: '/security' },
    { text: 'Compliance', icon: <GavelIcon />, path: '/compliance' },
    { text: 'Catalog Commander', icon: <Inventory2OutlinedIcon />, path: '/catalog-commander' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'About', icon: <InfoIcon />, path: '/about' },
  ];

  const drawer = (
    <div>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: isCollapsed ? 'center' : 'space-between',
        px: isCollapsed ? 1 : 2
      }}>
        {!isCollapsed && (
          <Typography variant="h6" noWrap component="div">
            UC Toolkit
          </Typography>
        )}
        <IconButton onClick={handleDrawerCollapse}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem
            key={item.text}
            disablePadding
          >
            <Tooltip title={isCollapsed ? item.text : ""} placement="right">
              <ListItemButton
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  minHeight: 48,
                  justifyContent: isCollapsed ? 'center' : 'initial',
                  px: 2.5,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isCollapsed ? 0 : 3,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && <ListItemText primary={item.text} />}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
    </div>
  );

  const currentDrawerWidth = isCollapsed ? collapsedDrawerWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 0, mr: 3 }}>
            Unity Catalog Swiss Army Knife
          </Typography>
          
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
            <SearchBar width={300} placeholder="Search data products, terms, contracts..." />
          </Box>
          
          <Box sx={{ position: 'relative' }}>
            <NotificationBell />
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ 
          width: { sm: currentDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { 
            sm: `calc(100% - ${currentDrawerWidth}px)` 
          },
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

export default Layout; 