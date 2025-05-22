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
  const [chatToDelete, setChatToDelete] = useState(null); // НОВОЕ: отдельное состояние для чата к удалению
  const [newTitle, setNewTitle] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuClick = (event, chat) => {
    // КРИТИЧНО: Останавливаем всплытие события
    event.stopPropagation();
    event.preventDefault();
    
    console.log('Opening menu for chat:', chat.id);
    setSelectedChat(chat);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // НЕ очищаем selectedChat здесь, чтобы диалоги работали корректно
  };

  const handleChatClick = (chatId) => {
    // Проверяем, не открыто ли меню
    if (anchorEl) {
      return; // Игнорируем клик если меню открыто
    }
    
    console.log('Navigating to chat:', chatId);
    navigate(`/chat/${chatId}`);
  };

  const handleEdit = () => {
    if (selectedChat) {
      console.log('Editing chat:', selectedChat.id);
      setNewTitle(selectedChat.title);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedChat) {
      console.log('Delete action for chat:', selectedChat.id);
      setChatToDelete(selectedChat); // ИСПРАВЛЕНО: сохраняем чат для удаления в отдельном состоянии
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedChat && newTitle.trim()) {
      console.log('Saving chat title:', newTitle);
      try {
        await updateChat(selectedChat.id, { title: newTitle.trim() });
        console.log('Chat title updated successfully');
      } catch (error) {
        console.error('Error updating chat title:', error);
      }
    }
    setEditDialogOpen(false);
    setSelectedChat(null); // Очищаем только после завершения операции
    setNewTitle('');
  };

  const handleDeleteConfirm = async () => {
    if (!chatToDelete) { // ИСПРАВЛЕНО: используем chatToDelete вместо selectedChat
      console.error('No chat selected for deletion');
      return;
    }

    setIsDeleting(true);
    console.log('Confirming delete for chat:', chatToDelete.id);
    
    try {
      const success = await deleteChat(chatToDelete.id);
      console.log('Delete result:', success);
      
      if (success) {
        // Если удаляем текущий активный чат, переходим к новому чату
        if (currentChatId === chatToDelete.id) {
          console.log('Deleted current active chat, navigating to new chat');
          navigate('/chat/new');
        }
        
        console.log('Chat deleted successfully');
      } else {
        console.error('Failed to delete chat');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null); // ИСПРАВЛЕНО: очищаем chatToDelete
      setSelectedChat(null); // Очищаем selectedChat
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setChatToDelete(null); // ИСПРАВЛЕНО: очищаем chatToDelete при отмене
    setSelectedChat(null);
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setSelectedChat(null);
    setNewTitle('');
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
          const date = formatDate(chat.updated_at) || formatDate(chat.created_at) || '';
          
          return (
            <ListItem key={chat.id} disablePadding>
              <ListItemButton
                onClick={() => handleChatClick(chat.id)}
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
                
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10
                  }}
                >
                  <Tooltip title="Действия">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, chat)}
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
        })}
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

      {/* Диалог редактирования */}
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

      {/* Диалог удаления */}
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

export default ChatList;