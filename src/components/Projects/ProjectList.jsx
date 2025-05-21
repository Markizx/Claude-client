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
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleMenuClick = (event, project) => {
    // Останавливаем всплытие события, чтобы не вызвать клик по проекту
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    setSelectedProject(project);
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProject(null);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/project/${projectId}`);
  };

  const handleEdit = () => {
    if (selectedProject) {
      setNewTitle(selectedProject.title || selectedProject.name || '');
      setNewDescription(selectedProject.description || '');
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
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
      await updateProject(selectedProject.id, { 
        title: newTitle.trim(),
        description: newDescription.trim()
      });
    }
    setEditDialogOpen(false);
    setSelectedProject(null);
    setNewTitle('');
    setNewDescription('');
  };

  const handleDeleteConfirm = async () => {
    if (selectedProject) {
      await deleteProject(selectedProject.id);
    }
    setDeleteDialogOpen(false);
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
                      <Typography variant="body2" noWrap>
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
                        {formatDate(project.updated_at) || formatDate(project.createdAt) || 'Дата неизвестна'}
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
                <ListItemSecondaryAction>
                  <Tooltip title="Действия">
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuClick(e, project)}
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

      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
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
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleEditSave} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Удалить проект?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить проект "{selectedProject?.title || selectedProject?.name || 'Проект без названия'}"? 
            Все файлы проекта будут удалены. Это действие нельзя отменить.
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

export default ProjectList;