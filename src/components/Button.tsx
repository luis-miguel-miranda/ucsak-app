import React from 'react';
import { Button as MuiButton, ButtonGroup as MuiButtonGroup } from '@mui/material';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained' | 'danger';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled,
  variant = 'contained' 
}) => {
  const color = variant === 'danger' ? 'error' : 'primary';
  
  return (
    <MuiButton
      onClick={onClick}
      disabled={disabled}
      variant={variant === 'danger' ? 'contained' : variant}
      color={color}
    >
      {children}
    </MuiButton>
  );
};

export const ButtonGroup: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <MuiButtonGroup variant="contained">
      {children}
    </MuiButtonGroup>
  );
}; 