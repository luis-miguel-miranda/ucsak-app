import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import CategoryIcon from '@mui/icons-material/Category';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

function Navigation() {
  const location = useLocation();
  
  const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Data Products', icon: <CategoryIcon />, path: '/data-products' },
    { text: 'Data Contracts', icon: <DescriptionIcon />, path: '/data-contracts' },
    { text: 'Business Glossary', icon: <MenuBookIcon />, path: '/business-glossary' },
    { text: 'Master Data', icon: <CompareArrowsIcon />, path: '/master-data' },
    { text: 'Entitlements', icon: <SecurityIcon />, path: '/entitlements' },
    { text: 'Catalog Commander', icon: <Inventory2OutlinedIcon />, path: '/catalog-commander' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'About', icon: <InfoIcon />, path: '/about' },
  ];

  return (
    <>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </>
  );
}

export default Navigation; 