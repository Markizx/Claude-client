import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  TextField,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  Typography,
  Alert,
  Divider,
  Collapse,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useDropzone } from 'react-dropzone';

const InputArea = ({ 
  onSendMessage, 
  loading, 
  projects, 
  selectedProjectId, 
  onProjectSelect,
  disabled = false 
}) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState('');
  const [projectFiles, setProjectFiles] = useState([]);
  const [projectFilesExpanded, setProjectFilesExpanded] = useState(true);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Мемоизированный активный проект
  const activeProject = useMemo(() => {
    return projects?.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);

  // Оптимизированное получение файлов проекта
  const getProjectFiles = useCallback(async (projectId) => {
    if (!projectId) return [];
    
    try {
      // Сначала пробуем получить из activeProject
      if (activeProject && activeProject.id === projectId && activeProject.files?.length > 0) {
        return activeProject.files.map(file => ({
          id: file.id,
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size,
          isProjectFile: true
        }));
      }
      
      // Если нет в кеше, получаем через API
      if (window.electronAPI) {
        const projectFiles = await window.electronAPI.getProjectFiles(projectId);
        if (projectFiles?.length > 0) {
          return projectFiles.map(file => ({
            id: file.id,
            name: file.name,
            path: file.path,
            type: file.type,
            size: file.size,
            isProjectFile: true
          }));
        }
      }
      
      return [];
    } catch (error) {
      console.error('Ошибка получения файлов проекта:', error);
      return [];
    }
  }, [activeProject]);

  // Оптимизированное обновление файлов проекта
  useEffect(() => {
    let cancelled = false;
    
    if (selectedProjectId) {
      getProjectFiles(selectedProjectId).then(files => {
        if (!cancelled) {
          setProjectFiles(files);
        }
      });
    } else {
      setProjectFiles([]);
    }
    
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, getProjectFiles]);

  // Обработка drag and drop с debounce
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles?.length > 0) {
      setError(`Некоторые файлы были отклонены. Максимальный размер: 50MB`);
      setTimeout(() => setError(''), 3000);
    }

    if (acceptedFiles?.length > 0) {
      const newFiles = acceptedFiles.map(file => ({
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        file: file
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024,
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  // Оптимизированная отправка с немедленной очисткой поля
  const handleSubmit = useCallback(async (event) => {
  if (event?.preventDefault) {
    event.preventDefault();
  }
  
  // ВАЖНО: разрешаем отправку файлов проекта даже без текста
  if (!message.trim() && files.length === 0 && projectFiles.length === 0) return;
  
  // НЕМЕДЛЕННО очищаем поле ввода для лучшего UX
  const messageToSend = message.trim();
  const filesToSend = [...files];
  const projectFilesToSend = [...projectFiles];
  
  setMessage('');
  setFiles([]);
  setError('');
  
  try {
    // Подготавливаем файлы для отправки
    const uploadedFiles = await Promise.all(
      filesToSend.map(async (fileData) => {
        if (fileData.path) {
          return {
            name: fileData.name,
            size: fileData.size,
            type: fileData.type,
            path: fileData.path
          };
        }
        
        if (fileData.file && window.electronAPI) {
          const result = await window.electronAPI.uploadFile(fileData.file);
          if (result?.success) {
            return {
              name: fileData.name,
              size: fileData.size,
              type: fileData.type,
              path: result.path
            };
          }
        }
        return null;
      })
    );

    const validFiles = uploadedFiles.filter(file => file !== null);
    await onSendMessage(messageToSend, validFiles, projectFilesToSend);
    
  } catch (err) {
    setError('Ошибка при отправке: ' + (err.message || err));
    // Восстанавливаем данные при ошибке
    setMessage(messageToSend);
    setFiles(filesToSend);
    setTimeout(() => setError(''), 5000);
  }
}, [message, files, projectFiles, onSendMessage]);

  // Оптимизированные обработчики событий
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleMessageChange = useCallback((e) => {
    setMessage(e.target.value);
    if (error) setError('');
  }, [error]);

  const handleFileSelect = useCallback(async () => {
    try {
      if (!window.electronAPI) return;

      const result = await window.electronAPI.openFileDialog();
      if (result?.success && result.files?.length > 0) {
        const newFiles = result.files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          path: file.path
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      setError('Ошибка при выборе файлов');
      setTimeout(() => setError(''), 3000);
    }
  }, []);

  const handleRemoveFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProjectChange = useCallback((e) => {
    onProjectSelect?.(e.target.value);
  }, [onProjectSelect]);

  const toggleProjectFiles = useCallback(() => {
    setProjectFilesExpanded(prev => !prev);
  }, []);

  const handleVoiceInput = useCallback((e) => {
    e?.stopPropagation?.();
    
    if (!isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          
          mediaRecorder.start();
          setIsRecording(true);
          setRecordingTime(0);
          
          recordingIntervalRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
          }, 1000);
        })
        .catch(() => {
          setError('Ошибка доступа к микрофону');
          setTimeout(() => setError(''), 3000);
        });
    } else {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  }, [isRecording]);

  const formatRecordingTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <Box 
      component="form" 
      onSubmit={handleSubmit}
      {...getRootProps()}
      sx={{ 
        position: 'relative',
        borderRadius: 2,
        border: isDragActive ? '2px dashed' : 'none',
        borderColor: isDragActive ? 'primary.main' : 'transparent',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        transition: 'all 0.2s ease',
      }}
    >
      <input {...getInputProps()} />
      
      {isDragActive && (
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
          zIndex: 10,
        }}>
          <Typography variant="h6" color="primary">
            Перетащите файлы сюда
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {projects?.length > 0 && (
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <InputLabel>Проект (контекст)</InputLabel>
          <Select
            value={selectedProjectId || ''}
            onChange={handleProjectChange}
            label="Проект (контекст)"
            disabled={disabled || loading}
          >
            <MenuItem value="">
              <em>Без контекста проекта</em>
            </MenuItem>
            {projects.map((project) => (
              <MenuItem key={project.id} value={project.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon fontSize="small" />
                  {project.title || project.name}
                  {project.files?.length > 0 && (
                    <Chip 
                      label={`${project.files.length} файлов`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {projectFiles.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2, mb: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: '2px solid',
            borderColor: 'success.main',
          }}
        >
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              cursor: 'pointer',
              mb: projectFilesExpanded ? 1 : 0
            }}
            onClick={toggleProjectFiles}
          >
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
              📁 Файлы проекта будут переданы как контекст ({projectFiles.length})
            </Typography>
            <IconButton size="small" color="success">
              {projectFilesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          
          <Collapse in={projectFilesExpanded}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {projectFiles.map((file, index) => (
                <Chip
                  key={file.id || index}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{file.name}</span>
                      <Typography variant="caption" color="text.secondary">
                        ({Math.round(file.size / 1024)}KB)
                      </Typography>
                    </Box>
                  }
                  variant="outlined"
                  color="success"
                  size="small"
                  sx={{ maxWidth: 250 }}
                />
              ))}
            </Box>
          </Collapse>
        </Paper>
      )}

      {files.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            📎 Прикрепленные файлы ({files.length}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {files.map((file, index) => (
              <Chip
                key={file.id || index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{file.name}</span>
                    <Typography variant="caption" color="text.secondary">
                      ({Math.round(file.size / 1024)}KB)
                    </Typography>
                  </Box>
                }
                variant="outlined"
                onDelete={() => handleRemoveFile(index)}
                deleteIcon={<CloseIcon />}
                size="small"
                sx={{ maxWidth: 250 }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {isRecording && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'error.light' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 8, height: 8,
              borderRadius: '50%',
              bgcolor: 'error.main',
              animation: 'pulse 1.5s infinite',
            }} />
            <Typography variant="body2">
              Запись... {formatRecordingTime(recordingTime)}
            </Typography>
          </Box>
        </Paper>
      )}

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={6}
          placeholder="Напишите сообщение Claude..."
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || loading}
          variant="outlined"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, pr: 1 } }}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Прикрепить файл">
                  <IconButton
                    onClick={handleFileSelect}
                    disabled={disabled || loading}
                    size="small"
                    color="primary"
                  >
                    <AttachFileIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={isRecording ? "Остановить запись" : "Голосовой ввод"}>
                  <IconButton
                    onClick={handleVoiceInput}
                    disabled={disabled || loading}
                    size="small"
                    color={isRecording ? "error" : "primary"}
                  >
                    {isRecording ? <StopIcon /> : <MicIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            ),
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            disabled={disabled || loading || (!message.trim() && files.length === 0)}
            type="button"
            onClick={handleSubmit}
            sx={{
              borderRadius: 3,
              minWidth: 'auto',
              px: 3, py: 1.5,
              height: 56,
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </Box>

      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Enter - отправить, Shift+Enter - новая строка
        </Typography>
        {projectFiles.length > 0 && (
          <>
            <span>•</span>
            <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
              📁 {projectFiles.length} файлов проекта будут переданы как контекст
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(InputArea);