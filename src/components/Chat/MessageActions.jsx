import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShareIcon from '@mui/icons-material/Share';

const MessageActions = ({ 
  message, 
  onCopy, 
  onEdit, 
  onDelete, 
  onRegenerate, 
  onShare,
  canEdit = false,
  canDelete = false,
  canRegenerate = false 
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const open = Boolean(anchorEl);

  // Защита от некорректных данных
  if (!message) {
    return null;
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = () => {
    if (onCopy) {
      onCopy(message.content || '');
    }
    handleClose();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message);
    }
    handleClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setDeleteDialogOpen(false);
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
    handleClose();
  };

  const handleShare = () => {
    if (onShare) {
      onShare(message);
    }
    handleClose();
  };

  return (
    <Box>
      <Tooltip title="Действия">
        <IconButton
          size="small"
          onClick={handleClick}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Копировать</ListItemText>
        </MenuItem>
        
        {canEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Редактировать</ListItemText>
          </MenuItem>
        )}
        
        {canRegenerate && (
          <MenuItem onClick={handleRegenerate}>
            <ListItemIcon>
              <RefreshIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Регенерировать</ListItemText>
          </MenuItem>
        )}
        
        <MenuItem onClick={handleShare}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Поделиться</ListItemText>
        </MenuItem>
        
        {canDelete && (
          <>
            <MenuItem divider />
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText>Удалить</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить сообщение?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageActions;