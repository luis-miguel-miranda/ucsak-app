import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Tooltip,
} from '@mui/material';
import AccountCircle from '@mui/icons-material/AccountCircle';

interface UserInfo {
  email: string | null;
  username: string | null;
  user: string | null;
  ip: string | null;
}

function UserInfo() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log('Fetching user information...');
        const response = await fetch('/api/user/info');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('User information received:', data);
        setUserInfo(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error('Error fetching user info:', errorMessage);
        setError(errorMessage);
      }
    };

    fetchUserInfo();
  }, []);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    console.log('Opening user info menu');
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    console.log('Closing user info menu');
    setAnchorEl(null);
  };

  const displayName = userInfo?.username || userInfo?.email || userInfo?.user || 'n/a';

  return (
    <>
      <Tooltip title="User Information">
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
        >
          <Avatar sx={{ width: 32, height: 32 }}>
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="menu-appbar"
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1">{displayName}</Typography>
            {userInfo?.email && (
              <Typography variant="body2" color="text.secondary">
                {userInfo.email}
              </Typography>
            )}
            {userInfo?.ip && (
              <Typography variant="caption" color="text.secondary">
                IP: {userInfo.ip}
              </Typography>
            )}
            {error && (
              <Typography variant="caption" color="error">
                Error: {error}
              </Typography>
            )}
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}

export default UserInfo; 