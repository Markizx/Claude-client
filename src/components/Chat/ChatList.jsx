import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Tooltip,
  Chip
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useChat } from '../../contexts/ChatContext';

const ChatList = ({ chats, currentChatId }) => {
  const navigate = useNavigate();
  const { updateChat, deleteChat } = useChat();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const handleMenuClick = (event, chat) => {
    // Останавливаем всплытие события, чтобы не вызвать клик по чату
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    setSelectedChat(chat);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedChat(null);
  };

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const handleEdit = () => {
    if (selectedChat) {
      setNewTitle(selectedChat.title);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedChat && newTitle.trim()) {
      await updateChat(selectedChat.id, { title: newTitle.trim() });
    }
    setEditDialogOpen(false);
    setSelectedChat(null);
    setNewTitle('');
  };

  const handleDeleteConfirm = async () => {
    if (selectedChat) {
      const success = await deleteChat(selectedChat.id);
      if (success && currentChatId === selectedChat.id) {
        navigate('/chat/new');
      }
    }
    setDeleteDialogOpen(false);
    setSelectedChat(null);
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString || dateString === 'Invalid Date') {
        return '';
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const chatDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (chatDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (!chats || chats.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Нет чатов. Создайте новый чат для начала общения.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ p: 0 }}>
        {chats.map((chat) => {
          const isSelected = currentChatId === (chat.id ? chat.id.toString() : '');
          const chatTitle = chat.title || 'Новый чат';
          const date = formatDate(chat.updated_at) || formatDate(chat.createdAt) || '';
          
          return (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton
                onClick={() => handleChatClick(chat.id)}
                selected={isSelected}
                sx={{
                  borderRadius: 1,
                  mx: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={chatTitle}
                  secondary={date}
                  primaryTypographyProps={{
                    noWrap: true,
                    sx: { fontSize: '0.9rem' }
                  }}
                  secondaryTypographyProps={{
                    noWrap: true,
                    sx: { fontSize: '0.75rem' }
                  }}
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Действия">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, chat)}
                      sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Переименовать</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
      >
        <DialogTitle>Переименовать чат</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название чата"
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleEditSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удалить чат?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить чат "{selectedChat?.title || 'Новый чат'}"? 
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatList;