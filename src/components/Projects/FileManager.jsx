import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Paper,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import TextSnippetIcon from '@mui/icons-material/TextSnippet';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
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
const getFileIcon = (fileType) => {
  if (fileType?.includes('pdf')) {
    return <PictureAsPdfIcon />;
  } else if (fileType?.includes('image')) {
    return <ImageIcon />;
  } else if (fileType?.includes('text')) {
    return <TextSnippetIcon />;
  } else if (
    fileType?.includes('javascript') || 
    fileType?.includes('json') || 
    fileType?.includes('html') || 
    fileType?.includes('css') || 
    fileType?.includes('python')
  ) {
    return <CodeIcon />;
  } else {
    return <InsertDriveFileIcon />;
  }
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
    } finally {
      setUploading(false);
    }
  };

  // Используем безопасное определение обработчиков событий
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: false,
    noKeyboard: false
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
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', mb: 2 }}>
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

      <Paper 
        variant="outlined"
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          p: 2,
          mb: 2,
          border: isDragActive ? '2px dashed #6e56cf' : '1px solid rgba(0, 0, 0, 0.12)',
          backgroundColor: isDragActive ? 'rgba(110, 86, 207, 0.08)' : 'transparent',
          cursor: 'pointer'
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        {isDragActive ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CloudUploadIcon fontSize="large" color="primary" sx={{ mb: 1 }} />
            <Typography variant="body1" color="primary">
              Перетащите файлы сюда...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CloudUploadIcon fontSize="large" color="action" sx={{ mb: 1, opacity: 0.6 }} />
            <Typography variant="body1" color="text.secondary">
              Перетащите файлы сюда или нажмите для выбора
            </Typography>
          </Box>
        )}
      </Paper>

      {files && files.length > 0 ? (
        <Paper 
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <List sx={{ width: '100%' }}>
            {files.map((file, index) => (
              <React.Fragment key={file.id || index}>
                <ListItem>
                  <ListItemIcon>
                    {getFileIcon(file.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={file.name}
                    secondary={formatFileSize(file.size)}
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Скачать файл">
                      <IconButton 
                        edge="end" 
                        onClick={() => handleDownloadFile(file)}
                        disabled={loading}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить файл">
                      <IconButton 
                        edge="end" 
                        onClick={() => onRemove(file.id)}
                        disabled={loading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < files.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
          Нет загруженных файлов
        </Typography>
      )}
    </Box>
  );
};

export default FileManager;