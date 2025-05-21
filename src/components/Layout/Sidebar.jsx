import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Typography,
  Button,
  IconButton,
  Tooltip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Collapse,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CloseIcon from '@mui/icons-material/Close';
import { useChat } from '../../contexts/ChatContext';
import { useProject } from '../../contexts/ProjectContext';
import ChatList from '../Chat/ChatList';
import ProjectList from '../Projects/ProjectList';
import SettingsDialog from '../Settings/SettingsDialog';

const Sidebar = ({ onItemClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chats, createChat } = useChat();
  const { projects, createProject } = useProject();
  
  // Состояния для диалогов
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchDialogOpen, setSearchDialogOpen] = useState(false);
  
  // Состояния для сворачивания секций
  const [chatsExpanded, setChatsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  
  // Состояния для создания элементов
  const [newChatTitle, setNewChatTitle] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  
  // Состояние для поиска
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Получение текущего ID из URL
  const getCurrentChatId = () => {
    const match = location.pathname.match(/^\/chat\/(.+)$/);
    return match ? match[1] : null;
  };

  const getCurrentProjectId = () => {
    const match = location.pathname.match(/^\/project\/(.+)$/);
    return match ? match[1] : null;
  };

  // Обработчики создания
  const handleCreateChat = async () => {
    const title = newChatTitle.trim() || 'Новый чат';
    const newChat = await createChat(title);
    
    if (newChat && newChat.id) {
      navigate(`/chat/${newChat.id}`);
      if (onItemClick) onItemClick();
    }
    
    setNewChatDialogOpen(false);
    setNewChatTitle('');
  };

  const handleCreateProject = async () => {
    const title = newProjectTitle.trim() || 'Новый проект';
    const description = newProjectDescription.trim();
    const newProject = await createProject(title, description);
    
    if (newProject && newProject.id) {
      navigate(`/project/${newProject.id}`);
      if (onItemClick) onItemClick();
    }
    
    setNewProjectDialogOpen(false);
    setNewProjectTitle('');
    setNewProjectDescription('');
  };

  // Обработчик поиска
  const handleSearch = async (query) => {
    if (!query.trim() || !window.electronAPI) return;

    setSearchLoading(true);
    try {
      const results = await window.electronAPI.searchMessages(query);
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results.error) {
        console.error('Ошибка поиска:', results.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleSearch(searchQuery);
  };

  const handleSearchResultClick = (result) => {
    navigate(`/chat/${result.chat_id}`);
    setSearchDialogOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    if (onItemClick) onItemClick();
  };

  // Обработчик настроек
  const handleSettingsClick = () => {
    setSettingsOpen(true);
    if (onItemClick) onItemClick();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      {/* Заголовок */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 2 }}>
        <Typography variant="h6">
          Claude Desktop
        </Typography>
        <Box>
          <Tooltip title="Поиск">
            <IconButton size="small" onClick={() => setSearchDialogOpen(true)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Настройки">
            <IconButton size="small" onClick={handleSettingsClick}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Кнопки создания */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setNewChatDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Новый чат
        </Button>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setNewProjectDialogOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Проект
        </Button>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Секция чатов */}
      <Box sx={{ mb: 2 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 1,
            px: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
          onClick={() => setChatsExpanded(!chatsExpanded)}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Чаты ({chats.length})
          </Typography>
          <IconButton size="small">
            {chatsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={chatsExpanded}>
          <Box sx={{ maxHeight: '40vh', overflowY: 'auto' }}>
            <ChatList 
              chats={chats} 
              currentChatId={getCurrentChatId()}
            />
          </Box>
        </Collapse>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Секция проектов */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            cursor: 'pointer',
            py: 1,
            px: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' }
          }}
          onClick={() => setProjectsExpanded(!projectsExpanded)}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Проекты ({projects.length})
          </Typography>
          <IconButton size="small">
            {projectsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={projectsExpanded}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <ProjectList 
              projects={projects} 
              currentProjectId={getCurrentProjectId()}
            />
          </Box>
        </Collapse>
      </Box>

      {/* Диалог создания чата */}
      <Dialog open={newChatDialogOpen} onClose={() => setNewChatDialogOpen(false)}>
        <DialogTitle>Новый чат</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название чата (необязательно)"
            type="text"
            fullWidth
            variant="outlined"
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            placeholder="Новый чат"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateChat} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог создания проекта */}
      <Dialog open={newProjectDialogOpen} onClose={() => setNewProjectDialogOpen(false)}>
        <DialogTitle>Новый проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название проекта"
            type="text"
            fullWidth
            variant="outlined"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="Новый проект"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание (необязательно)"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newProjectDescription}
            onChange={(e) => setNewProjectDescription(e.target.value)}
            placeholder="Описание проекта..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewProjectDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleCreateProject} variant="contained">Создать</Button>
        </DialogActions>
      </Dialog>

      {/* Диалог поиска */}
      <Dialog 
        open={searchDialogOpen} 
        onClose={() => setSearchDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Поиск по сообщениям</Typography>
            <IconButton onClick={() => setSearchDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSearchSubmit}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Введите текст для поиска..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: (
                  <IconButton type="submit" disabled={searchLoading}>
                    <SearchIcon />
                  </IconButton>
                ),
              }}
            />
          </form>

          {searchLoading && (
            <Typography color="text.secondary" align="center">
              Поиск...
            </Typography>
          )}

          {!searchLoading && searchQuery && searchResults.length === 0 && (
            <Typography color="text.secondary" align="center">
              Ничего не найдено
            </Typography>
          )}

          {searchResults.length > 0 && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Найдено результатов: {searchResults.length}
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                {searchResults.map((result, index) => (
                  <Box
                    key={result.id}
                    onClick={() => handleSearchResultClick(result)}
                    sx={{
                      p: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                      {result.chat_title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      {result.content.length > 150 
                        ? result.content.substring(0, 150) + '...'
                        : result.content}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(result.timestamp).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Диалог настроек */}
      <SettingsDialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
};

export default Sidebar;