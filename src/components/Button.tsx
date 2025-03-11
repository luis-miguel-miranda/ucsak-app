import React from 'react';
import { Button as MuiButton, ButtonGroup as MuiButtonGroup } from '@mui/material';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  disabled?: boolean;
  variant?: 'text' | 'outlined' | 'contained' | 'danger';
  sx?: React.CSSProperties | Record<string, any>;
  'aria-haspopup'?: boolean | 'dialog' | 'menu' | 'grid' | 'listbox' | 'tree';
  endIcon?: React.ReactNode;
  startIcon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
  title?: string;
}

interface ButtonGroupProps {
  children: React.ReactNode;
  variant?: 'text' | 'outlined' | 'contained';
  orientation?: 'horizontal' | 'vertical';
  sx?: React.CSSProperties | Record<string, any>;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  disabled,
  variant = 'contained',
  sx,
  'aria-haspopup': ariaHasPopup,
  startIcon,
  endIcon,
  color,
  title,
  ...rest
}) => {
  const buttonColor = variant === 'danger' ? 'error' : color || 'primary';
  
  return (
    <MuiButton
      onClick={onClick}
      disabled={disabled}
      variant={variant === 'danger' ? 'contained' : variant}
      color={buttonColor}
      sx={sx}
      aria-haspopup={ariaHasPopup}
      startIcon={startIcon}
      endIcon={endIcon}
      title={title}
      {...rest}
    >
      {children}
    </MuiButton>
  );
};

export const TransferButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  variant = 'contained',
  orientation = 'vertical',
  sx 
}) => {
  return (
    <MuiButtonGroup 
      variant={variant}
      orientation={orientation}
      size="small"
      disableElevation
      sx={{ 
        gap: 1,
        '& .MuiButtonGroup-grouped': {
          border: 'none !important',
          borderRadius: '4px !important',
          minWidth: 0,
          px: 1,
        },
        ...sx
      }}
    >
      {children}
    </MuiButtonGroup>
  );
};

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ 
  children, 
  variant = 'contained',
  orientation = 'horizontal',
  sx 
}) => {
  return (
    <MuiButtonGroup 
      variant={variant}
      orientation={orientation}
      disableElevation
      sx={{ 
        '& .MuiButtonGroup-grouped': {
          border: 'none !important',
          borderRadius: 1,
          '&:not(:first-of-type)': {
            marginLeft: '8px !important',  // Space after first button
          },
          '&:first-of-type': {
            marginLeft: '0 !important',    // No space before first button
          },
          '&:last-of-type': {
            marginRight: '0 !important',   // No space after last button
          }
        },
        ...sx
      }}
    >
      {children}
    </MuiButtonGroup>
  );
}; 