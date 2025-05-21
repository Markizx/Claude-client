import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';

const Button = ({ 
  children, 
  loading = false, 
  startIcon, 
  variant = 'contained', 
  color = 'primary', 
  ...props 
}) => {
  return (
    <MuiButton
      variant={variant}
      color={color}
      startIcon={loading ? null : startIcon}
      disabled={loading || props.disabled}
      sx={{ 
        borderRadius: 2,
        textTransform: 'none',
        ...props.sx
      }}
      {...props}
    >
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        children
      )}
    </MuiButton>
  );
};

export default Button;