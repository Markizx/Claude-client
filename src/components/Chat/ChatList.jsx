import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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

// Мемоизированный компонент чата
const ChatListItem = React.memo(({ 
  chat, 
  isSelected, 
  onChatClick, 
  onMenuClick,
  formatDate 
}) => {
  const chatTitle = chat.title || 'Новый чат';
  const date = formatDate(chat.updated_at) || formatDate(chat.created_at) || '';
  
  return (
    <ListItem disablePadding>
      <ListItemButton
        onClick={() => onChatClick(chat.id)}
        selected={isSelected}
        sx={{
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          position: 'relative',
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
            sx: { fontSize: '0.9rem', pr: 5 }
          }}
          secondaryTypographyProps={{
            noWrap: true,
            sx: { fontSize: '0.75rem' }
          }}
        />
        
        <Box sx={{
          position: 'absolute',
          right: 8,
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 10
        }}>
          <Tooltip title="Действия">
            <IconButton
              size="small"
              onClick={(e) => onMenuClick(e, chat)}
              sx={{ 
                opacity: 0.7, 
                '&:hover': { 
                  opacity: 1,
                  bgcolor: 'rgba(255,255,255,0.2)'
                },
                bgcolor: 'rgba(255,255,255,0.1)'
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </ListItemButton>
    </ListItem>
  );
});

ChatListItem.displayName = 'ChatListItem';

const ChatList = ({ chats, currentChatId }) => {
  const navigate = useNavigate();
  const { updateChat, deleteChat } = useChat();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Мемоизированная функция форматирования даты
  const formatDate = useCallback((dateString) => {
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
  }, []);

  // Оптимизированные обработчики событий
  const handleMenuClick = useCallback((event, chat) => {
    event.stopPropagation();
    event.preventDefault();
    
    setSelectedChat(chat);
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleChatClick = useCallback((chatId) => {
    if (anchorEl) return; // Игнорируем клик если меню открыто
    navigate(`/chat/${chatId}`);
  }, [navigate, anchorEl]);

  const handleEdit = useCallback(() => {
    if (selectedChat) {
      setNewTitle(selectedChat.title);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  }, [selectedChat, handleMenuClose]);

  const handleDelete = useCallback(() => {
    if (selectedChat) {
      setChatToDelete(selectedChat);
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  }, [selectedChat, handleMenuClose]);

  const handleEditSave = useCallback(async () => {
    if (selectedChat && newTitle.trim()) {
      try {
        await updateChat(selectedChat.id, { title: newTitle.trim() });
      } catch (error) {
        console.error('Error updating chat title:', error);
      }
    }
    setEditDialogOpen(false);
    setSelectedChat(null);
    setNewTitle('');
  }, [selectedChat, newTitle, updateChat]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!chatToDelete) return;

    setIsDeleting(true);
    
    try {
      const success = await deleteChat(chatToDelete.id);
      
      if (success && currentChatId === chatToDelete.id) {
        navigate('/chat/new');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
      setSelectedChat(null);
    }
  }, [chatToDelete, deleteChat, currentChatId, navigate]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
    setSelectedChat(null);
  }, []);

  const handleEditCancel = useCallback(() => {
    setEditDialogOpen(false);
    setSelectedChat(null);
    setNewTitle('');
  }, []);

  // Мемоизированный список чатов
  const chatItems = useMemo(() => {
    if (!chats || chats.length === 0) return null;

    return chats.map((chat) => {
      const isSelected = currentChatId === (chat.id ? chat.id.toString() : '');
      
      return (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={isSelected}
          onChatClick={handleChatClick}
          onMenuClick={handleMenuClick}
          formatDate={formatDate}
        />
      );
    });
  }, [chats, currentChatId, handleChatClick, handleMenuClick, formatDate]);

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
        {chatItems}
      </List>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Переименовать
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>

      <Dialog 
        open={editDialogOpen} 
        onClose={handleEditCancel}
        maxWidth="sm"
        fullWidth
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
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel}>Отмена</Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained"
            disabled={!newTitle.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={!isDeleting ? handleDeleteCancel : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Удалить чат?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить чат "{chatToDelete?.title || 'Новый чат'}"? 
            Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            disabled={isDeleting}
          >
            Отмена
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default React.memo(ChatList);