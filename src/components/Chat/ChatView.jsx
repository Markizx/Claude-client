import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { useChat } from '../../contexts/ChatContext';
import { useProject } from '../../contexts/ProjectContext';
import { useSettings } from '../../contexts/SettingsContext';
import MessageList from './MessageList';
import InputArea from './InputArea';
import SearchDialog from './SearchDialog';
import ExportDialog from './ExportDialog';

const ChatView = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { 
    currentChat, 
    messages, 
    loadChat, 
    sendMessage, 
    updateChat,
    deleteChat,
    regenerateLastResponse,
    exportChat,
    createChat, // ДОБАВЛЕНО: для создания чата
    loading, 
    error, 
    setError 
  } = useChat();
  const { projects } = useProject();
  const { settings } = useSettings();
  
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [editMessageDialogOpen, setEditMessageDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Загрузка чата при монтировании компонента или изменении chatId
  useEffect(() => {
    async function fetchChat() {
      if (chatId && chatId !== 'new') {
        const chat = await loadChat(chatId);
        // Если чат не найден, перенаправляем на новый чат
        if (!chat) {
          console.log('Чат не найден, перенаправляем на новый чат');
          navigate('/chat/new', { replace: true });
        }
      } else if (chatId === 'new') {
        // Для нового чата просто загружаем пустое состояние
        await loadChat('new');
      }
    }
    fetchChat();
  }, [chatId, loadChat, navigate]);

  // Прокрутка к последнему сообщению при добавлении нового
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // ДОБАВЛЕНО: обработчик создания нового чата
  const handleCreateNewChat = async () => {
    try {
      const newChat = await createChat('Новый чат');
      if (newChat && newChat.id) {
        navigate(`/chat/${newChat.id}`);
      }
    } catch (error) {
      setError('Ошибка при создании чата: ' + (error.message || String(error)));
    }
  };

  // Обработка отправки сообщения
  const handleSendMessage = async (content, files, projectFiles) => {
    if (!content.trim() && (!files || files.length === 0)) {
      return;
    }

    try {
      const result = await sendMessage(content, files, projectFiles);
      
      // ДОБАВЛЕНО: если чат был создан при отправке сообщения, обновляем URL
      if (result && chatId === 'new' && window.location.hash.includes('/chat/new')) {
        // URL уже должен быть обновлен в sendMessage, но на всякий случай проверяем
        if (currentChat && currentChat.id) {
          navigate(`/chat/${currentChat.id}`, { replace: true });
        }
      }
    } catch (error) {
      setError('Ошибка при отправке сообщения: ' + (error.message || String(error)));
    }
  };

  // Обработка действий с сообщениями
  const handleMessageAction = async (action, data) => {
    switch (action) {
      case 'edit':
        if (data && data.id) {
          setEditingMessage(data);
          setEditedContent(data.content);
          setEditMessageDialogOpen(true);
        }
        break;
        
      case 'delete':
        setMessageToDelete(data);
        setDeleteConfirmOpen(true);
        break;
        
      case 'regenerate':
        await handleRegenerate();
        break;
        
      case 'share':
        handleShareMessage(data);
        break;
        
      case 'copy':
        handleCopyMessage(data);
        break;
        
      default:
        console.log('Неизвестное действие:', action, data);
    }
  };

  // Обработка редактирования сообщения
  const handleEditMessage = async () => {
    if (!editingMessage || !editedContent.trim()) return;

    try {
      console.log('Редактирование сообщения не реализовано в API');
      setEditMessageDialogOpen(false);
      setEditingMessage(null);
      setEditedContent('');
    } catch (error) {
      setError('Ошибка при редактировании сообщения: ' + error.message);
    }
  };

  // Обработка удаления сообщения
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      console.log('Удаление сообщения не реализовано в API');
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    } catch (error) {
      setError('Ошибка при удалении сообщения: ' + error.message);
    }
  };

  // Обработка регенерации ответа
  const handleRegenerate = async () => {
    try {
      await regenerateLastResponse();
    } catch (error) {
      setError('Ошибка при регенерации ответа: ' + error.message);
    }
  };

  // Обработка копирования сообщения в буфер обмена
  const handleCopyMessage = async (message) => {
    if (!message || !message.content) return;
    
    try {
      await navigator.clipboard.writeText(message.content);
    } catch (error) {
      setError('Ошибка при копировании: ' + error.message);
    }
  };

  // Обработка поделиться сообщением
  const handleShareMessage = (message) => {
    if (!message || !message.content) return;
    
    if (navigator.share) {
      navigator.share({
        title: 'Сообщение из Claude Desktop',
        text: message.content,
      }).catch(error => {
        console.error('Ошибка при попытке поделиться:', error);
        handleCopyMessage(message);
      });
    } else {
      handleCopyMessage(message);
    }
  };

  // Обработка поиска
  const handleSearchResult = (result) => {
    if (result.chat_id !== currentChat?.id) {
      loadChat(result.chat_id);
    }
  };

  // Обработка экспорта
  const handleExport = async (format) => {
    if (!currentChat) return;
    
    try {
      const filePath = await exportChat(currentChat.id, format);
      if (filePath) {
        console.log('Чат экспортирован:', filePath);
      }
    } catch (error) {
      setError('Ошибка при экспорте чата: ' + error.message);
    }
  };

  // ИСПРАВЛЕНО: показываем специальный экран для нового чата
  if (chatId === 'new' && (!currentChat || !messages.length)) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        overflow: 'hidden',
        bgcolor: 'background.default'
      }}>
        {/* Заголовок нового чата */}
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography variant="h6">
              Новый чат
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Чат будет создан при отправке первого сообщения
            </Typography>
          </Box>
          
          <Box>
            <Tooltip title="Поиск по чатам">
              <IconButton onClick={() => setSearchDialogOpen(true)}>
                <SearchIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Центральная область для нового чата */}
        <Box sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h4" sx={{ mb: 2, color: 'text.secondary' }}>
            👋 Привет!
          </Typography>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Начните новый разговор с Claude
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
            Задайте любой вопрос, загрузите файлы для анализа или выберите проект для работы с контекстом.
          </Typography>
          
          {projects && projects.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              💡 У вас есть {projects.length} проектов. Выберите один из них ниже для работы с файлами проекта.
            </Typography>
          )}
        </Box>

        {/* Показываем ошибки */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ m: 2 }}
          >
            {error}
          </Alert>
        )}

        {/* Область ввода */}
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            m: 2, 
            borderRadius: 2
          }}
        >
          <InputArea 
            onSendMessage={handleSendMessage} 
            loading={loading}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={setSelectedProjectId}
          />
        </Paper>

        {/* Диалоги */}
        <SearchDialog
          open={searchDialogOpen}
          onClose={() => setSearchDialogOpen(false)}
          onResultClick={handleSearchResult}
        />
      </Box>
    );
  }

  if (!chatId || chatId === 'new') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="h6" color="text.secondary">
          Выберите чат или создайте новый
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden',
      bgcolor: 'background.default'
    }}>
      {/* Заголовок чата */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          borderBottom: '1px solid', 
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant="h6" noWrap>
            {currentChat ? currentChat.title : 'Загрузка...'}
          </Typography>
          {selectedProjectId && (
            <Typography variant="body2" color="text.secondary">
              Связан с проектом: {projects.find(p => p.id === selectedProjectId)?.title || projects.find(p => p.id === selectedProjectId)?.name}
            </Typography>
          )}
        </Box>
        
        <Box>
          <Tooltip title="Поиск по чату">
            <IconButton onClick={() => setSearchDialogOpen(true)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Экспорт чата">
            <IconButton onClick={() => setExportDialogOpen(true)}>
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Сообщения чата */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2, py: 1 }}>
        {loading && messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <MessageList 
            messages={messages} 
            onMessageAction={handleMessageAction}
            showTimestamps={settings?.showTimestamps !== false}
            compact={settings?.compactMode === true}
          />
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Показываем ошибки */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ m: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Область ввода */}
      <Paper 
        elevation={3} 
        sx={{ 
          p: 2, 
          m: 2, 
          borderRadius: 2
        }}
      >
        <InputArea 
          onSendMessage={handleSendMessage} 
          loading={loading}
          projects={projects}
          selectedProjectId={selectedProjectId}
          onProjectSelect={setSelectedProjectId}
        />
      </Paper>

      {/* Диалоги */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onResultClick={handleSearchResult}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        chat={currentChat}
        onExport={handleExport}
      />

      {/* Остальные диалоги остаются без изменений */}
      <Dialog 
        open={editMessageDialogOpen} 
        onClose={() => setEditMessageDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Редактировать сообщение</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Содержимое сообщения"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMessageDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleEditMessage}
            variant="contained"
            disabled={!editedContent.trim() || editedContent.trim() === editingMessage?.content}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Удалить сообщение?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleDeleteMessage}
            color="error" 
            variant="contained"
          >
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatView;