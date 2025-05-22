import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import { useDropzone } from 'react-dropzone';

// Функция форматирования размера файла
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Функция выбора иконки в зависимости от типа файла
const getFileIcon = (fileType, fileName) => {
  const iconProps = { sx: { fontSize: 40 } };
  
  if (fileType?.includes('pdf')) {
    return <PictureAsPdfIcon {...iconProps} color="error" />;
  } else if (fileType?.includes('image')) {
    return <ImageIcon {...iconProps} color="primary" />;
  } else if (fileType?.includes('text') || fileName?.endsWith('.md') || fileName?.endsWith('.txt')) {
    return <TextSnippetIcon {...iconProps} color="info" />;
  } else if (
    fileType?.includes('javascript') || 
    fileType?.includes('json') || 
    fileType?.includes('html') || 
    fileType?.includes('css') || 
    fileType?.includes('python') ||
    fileName?.endsWith('.js') ||
    fileName?.endsWith('.jsx') ||
    fileName?.endsWith('.ts') ||
    fileName?.endsWith('.tsx') ||
    fileName?.endsWith('.py') ||
    fileName?.endsWith('.html') ||
    fileName?.endsWith('.css') ||
    fileName?.endsWith('.json')
  ) {
    return <CodeIcon {...iconProps} color="success" />;
  } else {
    return <InsertDriveFileIcon {...iconProps} color="action" />;
  }
};

// Функция для получения цвета типа файла
const getFileTypeColor = (fileType, fileName) => {
  if (fileType?.includes('pdf')) {
    return '#f44336'; // красный
  } else if (fileType?.includes('image')) {
    return '#2196f3'; // синий
  } else if (fileType?.includes('text') || fileName?.endsWith('.md') || fileName?.endsWith('.txt')) {
    return '#2196f3'; // синий
  } else if (
    fileType?.includes('javascript') || 
    fileType?.includes('json') || 
    fileType?.includes('html') || 
    fileType?.includes('css') || 
    fileType?.includes('python') ||
    fileName?.endsWith('.js') ||
    fileName?.endsWith('.jsx') ||
    fileName?.endsWith('.ts') ||
    fileName?.endsWith('.tsx') ||
    fileName?.endsWith('.py') ||
    fileName?.endsWith('.html') ||
    fileName?.endsWith('.css') ||
    fileName?.endsWith('.json')
  ) {
    return '#4caf50'; // зеленый
  } else {
    return '#757575'; // серый
  }
};

// Компонент карточки файла
const FileCard = ({ file, onDownload, onDelete, onEdit, loading }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = () => {
    onDownload(file);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(file.id);
    handleMenuClose();
  };

  const handleEdit = () => {
    onEdit && onEdit(file);
    handleMenuClose();
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        },
        position: 'relative'
      }}
    >
      <CardContent sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        textAlign: 'center',
        p: 2,
        pb: 1
      }}>
        {/* Иконка файла */}
        <Box sx={{ mb: 2 }}>
          {getFileIcon(file.type, file.name)}
        </Box>

        {/* Название файла */}
        <Typography 
          variant="subtitle2" 
          sx={{ 
            mb: 1,
            wordBreak: 'break-word',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            lineHeight: 1.2,
            height: '2.4em'
          }}
          title={file.name}
        >
          {file.name}
        </Typography>

        {/* Размер файла */}
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ mb: 1 }}
        >
          {formatFileSize(file.size)}
        </Typography>

        {/* Тип файла */}
        <Box 
          sx={{ 
            px: 1, 
            py: 0.5, 
            borderRadius: 1, 
            bgcolor: getFileTypeColor(file.type, file.name),
            color: 'white',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          {file.type?.split('/')[1] || 'file'}
        </Box>

        {/* Описание файла, если есть */}
        {file.description && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              mt: 1,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitBoxOrient: 'vertical',
              WebkitLineClamp: 2,
            }}
          >
            {file.description}
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ 
        justifyContent: 'space-between', 
        px: 2, 
        pb: 2,
        pt: 0
      }}>
        {/* Кнопка скачивания */}
        <Tooltip title="Скачать файл">
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            disabled={loading}
            color="primary"
          >
            <DownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Меню действий */}
        <Tooltip title="Действия">
          <IconButton 
            size="small" 
            onClick={handleMenuClick}
            disabled={loading}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleDownload}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Скачать</ListItemText>
          </MenuItem>
          
          {onEdit && (
            <MenuItem onClick={handleEdit}>
              <ListItemIcon>
                <EditIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Редактировать</ListItemText>
            </MenuItem>
          )}
          
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Удалить</ListItemText>
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
};

const FileManager = ({ files, onUpload, onRemove, loading }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Обработчик drag'n'drop с безопасной проверкой событий
  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    
    try {
      setUploading(true);
      
      // Загружаем файлы по одному
      for (const file of acceptedFiles) {
        await onUpload(file);
      }
    } catch (error) {
      console.error('Ошибка при загрузке файлов:', error);
      setError('Ошибка при загрузке файлов: ' + (error.message || error));
    } finally {
      setUploading(false);
    }
  };

  // Используем безопасное определение обработчиков событий
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false,
    accept: {
      'text/*': ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.xml', '.csv'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/json': ['.json'],
    }
  });

  // Обработчик выбора файлов
  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.openFileDialog();
      
      if (result && result.success && result.files && result.files.length > 0) {
        setUploading(true);
        
        // Загружаем файлы по одному
        for (const file of result.files) {
          await onUpload(file);
        }
      }
    } catch (error) {
      console.error('Ошибка при выборе файлов:', error);
      setError('Ошибка при выборе файлов: ' + (error.message || error));
    } finally {
      setUploading(false);
    }
  };

  // Обработчик скачивания файла
  const handleDownloadFile = async (file) => {
    try {
      const savePath = await window.electronAPI.saveFileDialog(file.name);
      
      if (savePath && savePath.filePath) {
        await window.electronAPI.downloadFile(file.path, savePath.filePath);
      }
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      setError('Ошибка при скачивании файла: ' + (error.message || error));
    }
  };

  return (
    <Box>
      {/* Кнопка загрузки */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Файлы проекта ({files?.length || 0})
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          onClick={handleFileSelect}
          disabled={uploading || loading}
          sx={{ borderRadius: 2 }}
        >
          Загрузить файлы
        </Button>
      </Box>

      {/* Зона drag and drop */}
      <Paper 
        variant="outlined"
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          p: 3,
          mb: 3,
          border: isDragActive ? '2px dashed #6e56cf' : '2px dashed rgba(0, 0, 0, 0.12)',
          backgroundColor: isDragActive ? 'rgba(110, 86, 207, 0.08)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <Box sx={{ textAlign: 'center' }}>
          <CloudUploadIcon 
            sx={{ 
              fontSize: 48, 
              color: isDragActive ? 'primary.main' : 'action.disabled',
              mb: 2 
            }} 
          />
          <Typography 
            variant="h6" 
            color={isDragActive ? 'primary.main' : 'text.secondary'}
            gutterBottom
          >
            {isDragActive ? 'Перетащите файлы сюда...' : 'Перетащите файлы или нажмите для выбора'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Поддерживаются: изображения, текст, код, PDF, JSON
          </Typography>
        </Box>
      </Paper>

      {/* Ошибки */}
      {error && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="body2">
            {error}
          </Typography>
          <Button 
            size="small" 
            onClick={() => setError(null)}
            sx={{ mt: 1, color: 'inherit' }}
          >
            Закрыть
          </Button>
        </Paper>
      )}

      {/* Индикатор загрузки */}
      {uploading && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={20} color="inherit" />
            <Typography variant="body2">
              Загрузка файлов...
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Отображение файлов в виде плиток */}
      {files && files.length > 0 ? (
        <Grid container spacing={2}>
          {files.map((file, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={file.id || index}>
              <FileCard
                file={file}
                onDownload={handleDownloadFile}
                onDelete={onRemove}
                loading={loading}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper 
          variant="outlined" 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            borderRadius: 2,
            bgcolor: 'background.default'
          }}
        >
          <InsertDriveFileIcon 
            sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} 
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Нет загруженных файлов
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Загрузите файлы для работы с контекстом проекта
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FileManager;