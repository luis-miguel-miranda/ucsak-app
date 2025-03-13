import React, { useState, useEffect } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  subtitle?: string;
  description?: string;
  created_at: string;
  read: boolean;
  can_delete: boolean;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      const updatedNotification = await response.json();
      setNotifications(notifications.map(n => 
        n.id === id ? updatedNotification : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <InfoIcon color="info" />;
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <InfoIcon />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{ 
            '& .MuiBadge-badge': { 
              right: -3, 
              top: 13 
            } 
          }}
        >
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <NotificationsIcon sx={{ 
              color: notifications.length > 0 ? 'white' : 'action.disabled' 
            }} />
          </IconButton>
        </Badge>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { width: 350, maxHeight: 400 }
        }}
      >
        {notifications.length === 0 ? (
          <MenuItem>
            <Typography color="text.secondary">No notifications</Typography>
          </MenuItem>
        ) : (
          notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              {index > 0 && <Divider />}
              <MenuItem
                onClick={() => handleMarkRead(notification.id)}
                sx={{
                  backgroundColor: notification.read ? 'inherit' : 'action.hover',
                  py: 1,
                  position: 'relative',
                }}
              >
                <ListItemIcon>
                  {getIcon(notification.type)}
                </ListItemIcon>
                <ListItemText
                  primary={notification.title}
                  secondary={
                    <Box>
                      {notification.subtitle && (
                        <Typography variant="body2">
                          {notification.subtitle}
                        </Typography>
                      )}
                      {notification.description && (
                        <Typography variant="body2" color="text.secondary">
                          {notification.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(notification.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                {notification.can_delete && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </MenuItem>
            </React.Fragment>
          ))
        )}
      </Menu>
    </>
  );
} 