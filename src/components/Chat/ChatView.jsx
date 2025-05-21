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
      if (chatId) {
        const chat = await loadChat(chatId);
        // Если это новый чат, меняем URL
        if (chat && chat.id && chatId === 'new') {
          navigate(`/chat/${chat.id}`, { replace: true });
        }
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

  // Обработка отправки сообщения
const handleSendMessage = async (content, files) => {
  if (!content.trim() && (!files || files.length === 0)) {
    return;
  }

  try {
    // Если выбран проект, получаем его файлы как контекст
    let projectFiles = [];
    if (selectedProjectId) {
      console.log(`Выбран проект с ID: ${selectedProjectId}, загружаем файлы...`);
      
      // Если есть projects, ищем в кэше
      if (projects && projects.length > 0) {
        const selectedProject = projects.find(p => p.id === selectedProjectId);
        if (selectedProject) {
          console.log(`Найден проект: ${selectedProject.title || selectedProject.name}`);
          
          // Явно загружаем файлы проекта через API
          try {
            const projectFilesResult = await window.electronAPI.getProjectFiles(selectedProjectId);
            if (Array.isArray(projectFilesResult) && projectFilesResult.length > 0) {
              projectFiles = projectFilesResult;
              console.log(`Загружено ${projectFiles.length} файлов проекта`);
            } else {
              console.log('Файлы проекта не найдены или пустой массив');
            }
          } catch (fileError) {
            console.error('Ошибка загрузки файлов проекта:', fileError);
          }
        } else {
          console.log(`Проект с ID ${selectedProjectId} не найден в кэше`);
        }
      } else {
        // Если projects не доступен, загружаем файлы напрямую
        try {
          const projectFilesResult = await window.electronAPI.getProjectFiles(selectedProjectId);
          if (Array.isArray(projectFilesResult)) {
            projectFiles = projectFilesResult;
            console.log(`Загружено ${projectFiles.length} файлов проекта напрямую`);
          }
        } catch (fileError) {
          console.error('Ошибка загрузки файлов проекта напрямую:', fileError);
        }
      }
    }

    await sendMessage(content, files, projectFiles);
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
      // Здесь нужно добавить API метод для обновления сообщения
      // Пока что просто обновляем локально
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
      // Здесь нужно добавить API метод для удаления сообщения
      // Пока что просто скрываем диалог
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
        
        // Fallback - копирование в буфер обмена
        handleCopyMessage(message);
      });
    } else {
      // Fallback - копирование в буфер обмена
      handleCopyMessage(message);
    }
  };

  // Обработка поиска
  const handleSearchResult = (result) => {
    // Результат содержит chat_id, можно перейти к чату
    if (result.chat_id !== currentChat?.id) {
      loadChat(result.chat_id);
    }
    // Здесь можно добавить выделение найденного сообщения
  };

  // Обработка экспорта
  const handleExport = async (format) => {
    if (!currentChat) return;
    
    try {
      const filePath = await exportChat(currentChat.id, format);
      if (filePath) {
        // Уведомление об успешном экспорте
        console.log('Чат экспортирован:', filePath);
      }
    } catch (error) {
      setError('Ошибка при экспорте чата: ' + error.message);
    }
  };

  if (!chatId) {
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

      {/* Диалог поиска */}
      <SearchDialog
        open={searchDialogOpen}
        onClose={() => setSearchDialogOpen(false)}
        onResultClick={handleSearchResult}
      />

      {/* Диалог экспорта */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        chat={currentChat}
        onExport={handleExport}
      />

      {/* Диалог редактирования сообщения */}
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

      {/* Диалог подтверждения удаления */}
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