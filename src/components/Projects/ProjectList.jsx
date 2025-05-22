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
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ChatIcon from '@mui/icons-material/Chat';
import { useProject } from '../../contexts/ProjectContext';
import { useChat } from '../../contexts/ChatContext';

const ProjectList = ({ projects, currentProjectId }) => {
  const navigate = useNavigate();
  const { updateProject, deleteProject } = useProject();
  const { createChat } = useChat();
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null); // ИСПРАВЛЕНО: отдельное состояние
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMenuClick = (event, project) => {
    // ИСПРАВЛЕНО: Останавливаем всплытие события
    event.stopPropagation();
    event.preventDefault();
    
    console.log('ProjectList: Opening menu for project:', project.id);
    setSelectedProject(project);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // НЕ очищаем selectedProject здесь
  };

  const handleProjectClick = (projectId) => {
    // Проверяем, не открыто ли меню
    if (anchorEl) {
      return; // Игнорируем клик если меню открыто
    }
    
    console.log('ProjectList: Navigating to project:', projectId);
    navigate(`/project/${projectId}`);
  };

  const handleEdit = () => {
    if (selectedProject) {
      console.log('ProjectList: Editing project:', selectedProject.id);
      setNewTitle(selectedProject.title || selectedProject.name || '');
      setNewDescription(selectedProject.description || '');
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedProject) {
      console.log('ProjectList: Delete action for project:', selectedProject.id);
      setProjectToDelete(selectedProject); // ИСПРАВЛЕНО: сохраняем в отдельном состоянии
      setDeleteDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCreateChat = async () => {
    if (selectedProject) {
      const chatTitle = `Чат: ${selectedProject.title || selectedProject.name || 'Проект'}`;
      const newChat = await createChat(chatTitle);
      if (newChat && newChat.id) {
        navigate(`/chat/${newChat.id}`);
      }
    }
    handleMenuClose();
  };

  const handleEditSave = async () => {
    if (selectedProject && newTitle.trim()) {
      console.log('ProjectList: Saving project updates:', {
        id: selectedProject.id,
        title: newTitle.trim(),
        description: newDescription.trim()
      });
      
      try {
        await updateProject(selectedProject.id, { 
          title: newTitle.trim(),
          name: newTitle.trim(), // Также обновляем name для совместимости
          description: newDescription.trim()
        });
        console.log('ProjectList: Project updated successfully');
      } catch (error) {
        console.error('ProjectList: Error updating project:', error);
      }
    }
    handleEditCancel();
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setSelectedProject(null);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) {
      console.error('ProjectList: No project selected for deletion');
      return;
    }

    setIsDeleting(true);
    console.log('ProjectList: Confirming delete for project:', projectToDelete.id);
    
    try {
      const success = await deleteProject(projectToDelete.id);
      console.log('ProjectList: Delete result:', success);
      
      if (success) {
        // Если удаляем текущий активный проект, переходим на главную
        if (currentProjectId === projectToDelete.id) {
          console.log('ProjectList: Deleted current active project, navigating to home');
          navigate('/');
        }
        
        console.log('ProjectList: Project deleted successfully');
      } else {
        console.error('ProjectList: Failed to delete project');
      }
    } catch (error) {
      console.error('ProjectList: Error deleting project:', error);
    } finally {
      handleDeleteCancel();
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    setSelectedProject(null);
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
      const projectDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      if (projectDate.getTime() === today.getTime()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  if (!projects || projects.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Нет проектов. Создайте новый проект для организации файлов.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List sx={{ p: 0 }}>
        {projects.map((project) => {
          const isSelected = currentProjectId === (project.id ? project.id.toString() : '');
          const fileCount = project.files ? project.files.length : 0;
          const projectTitle = project.title || project.name || 'Проект без названия';
          
          return (
            <ListItem key={project.id} disablePadding>
              <ListItemButton
                onClick={() => handleProjectClick(project.id)}
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
                  <FolderIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ pr: 5 }}>
                        {projectTitle}
                      </Typography>
                      {fileCount > 0 && (
                        <Chip 
                          size="small" 
                          label={fileCount} 
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      {project.description && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          display="block"
                          noWrap
                        >
                          {project.description}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(project.updated_at) || formatDate(project.updatedAt) || formatDate(project.created_at) || formatDate(project.createdAt) || 'Дата неизвестна'}
                      </Typography>
                    </Box>
                  }
                  primaryTypographyProps={{
                    component: 'div'
                  }}
                  secondaryTypographyProps={{
                    component: 'div'
                  }}
                />
                
                {/* ИСПРАВЛЕННАЯ кнопка меню */}
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
                      onClick={(e) => handleMenuClick(e, project)}
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
        <MenuItem onClick={handleCreateChat}>
          <ListItemIcon>
            <ChatIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Создать чат</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
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
        <DialogTitle>Редактировать проект</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название проекта"
            type="text"
            fullWidth
            variant="outlined"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Описание"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
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
        <DialogTitle>Удалить проект?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить проект "{projectToDelete?.title || projectToDelete?.name || 'Проект без названия'}"? 
            Все файлы проекта будут удалены. Это действие нельзя отменить.
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

export default ProjectList;