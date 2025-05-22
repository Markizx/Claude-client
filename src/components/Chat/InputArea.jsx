import React, { useState, useCallback, useRef } from 'react';
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
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
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
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingIntervalRef = useRef(null);

  // Обработка drag and drop
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      setError(`Некоторые файлы были отклонены. Максимальный размер файла: 50MB`);
      setTimeout(() => setError(''), 5000);
    }

    // Обрабатываем принятые файлы
    if (acceptedFiles && acceptedFiles.length > 0) {
      acceptedFiles.forEach(file => {
        // Проверяем размер файла
        if (file.size > 50 * 1024 * 1024) {
          setError(`Файл ${file.name} слишком большой (максимум 50MB)`);
          setTimeout(() => setError(''), 5000);
          return;
        }

        // Добавляем файл в состояние
        const fileObj = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          file: file // Сохраняем файл для последующей отправки
        };

        console.log('Файл загружен:', fileObj);
        setFiles(prev => [...prev, fileObj]);
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    noClick: true,
    noKeyboard: true
  });

  // Обработка отправки формы
  const handleSubmit = (event) => {
    // Проверяем, является ли event объектом события и имеет ли он метод preventDefault
    if (event && typeof event.preventDefault === 'function') {
      event.preventDefault();
    }
    
    if (!message.trim() && files.length === 0) {
      return;
    }

    try {
      // Подготавливаем файлы для отправки
      Promise.all(
        files.map(async (fileData) => {
          try {
            // Если файл уже имеет путь, просто используем его
            if (fileData.path) {
              return {
                name: fileData.name,
                size: fileData.size,
                type: fileData.type,
                path: fileData.path
              };
            }
            
            // Иначе загружаем файл на сервер
            if (fileData.file && window.electronAPI) {
              console.log('Загрузка файла через Electron API:', fileData.name);
              
              try {
                const result = await window.electronAPI.uploadFile(fileData.file);
                
                if (result && result.success) {
                  return {
                    name: fileData.name,
                    size: fileData.size,
                    type: fileData.type,
                    path: result.path
                  };
                } else {
                  throw new Error(result?.error || 'Ошибка загрузки файла');
                }
              } catch (uploadError) {
                console.error('Ошибка загрузки файла:', uploadError);
                setError(`Ошибка загрузки файла ${fileData.name}: ${uploadError.message}`);
                return null;
              }
            }
            
            return null;
          } catch (fileError) {
            console.error('Ошибка при обработке файла:', fileError);
            return null;
          }
        })
      ).then(async (filesToSend) => {
        // Фильтруем null значения (файлы с ошибками)
        const validFiles = filesToSend.filter(file => file !== null);

        // Отправляем сообщение с файлами
        await onSendMessage(message, validFiles);
        
        // Очищаем форму после успешной отправки
        setMessage('');
        setFiles([]);
        setError('');
        
        // Освобождаем URL превью
        files.forEach(file => {
          if (file.preview && file.preview.startsWith('blob:')) {
            URL.revokeObjectURL(file.preview);
          }
        });
      }).catch(err => {
        setError('Ошибка при отправке сообщения: ' + (err.message || err));
        setTimeout(() => setError(''), 5000);
      });
    } catch (err) {
      setError('Ошибка при отправке сообщения: ' + (err.message || err));
      setTimeout(() => setError(''), 5000);
    }
  };

  // Обработка нажатия Enter
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  };

  // Обработка изменения текста
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    setError(''); // Очищаем ошибку при вводе
  };

  // Обработка выбора файлов через диалог
  const handleFileSelect = async () => {
    try {
      if (!window.electronAPI) {
        setError('Выбор файлов недоступен в браузерной версии');
        setTimeout(() => setError(''), 5000);
        return;
      }

      const result = await window.electronAPI.openFileDialog();
      
      if (result && result.success && result.files && result.files.length > 0) {
        const newFiles = result.files.map(file => ({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          path: file.path,
          preview: file.type && file.type.startsWith('image/') ? `file://${file.path}` : null
        }));
        
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (error) {
      console.error('Ошибка при выборе файлов:', error);
      setError('Ошибка при выборе файлов: ' + (error.message || error));
      setTimeout(() => setError(''), 5000);
    }
  };

  // Обработка удаления файла
  const handleRemoveFile = (index) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const removedFile = newFiles[index];
      
      // Освобождаем URL если он был создан
      if (removedFile.preview && removedFile.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removedFile.preview);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Обработка изменения проекта
  const handleProjectChange = (e) => {
    if (onProjectSelect) {
      onProjectSelect(e.target.value);
    }
  };

  // Голосовой ввод
  const handleVoiceInput = (e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    
    if (!isRecording) {
      // Начинаем запись
      try {
        navigator.mediaDevices.getUserMedia({ audio: true })
          .then(stream => {
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            mediaRecorder.onstop = () => {
              const blob = new Blob(chunks, { type: 'audio/wav' });
              // Здесь можно добавить обработку аудио
              console.log('Audio recorded:', blob);
            };
            
            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            
            recordingIntervalRef.current = setInterval(() => {
              setRecordingTime(prev => prev + 1);
            }, 1000);
          })
          .catch(error => {
            setError('Ошибка доступа к микрофону: ' + (error.message || error));
            setTimeout(() => setError(''), 5000);
          });
      } catch (error) {
        setError('Ошибка доступа к микрофону: ' + (error.message || error));
        setTimeout(() => setError(''), 5000);
      }
    } else {
      // Останавливаем запись
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Форматирование времени записи
  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box 
      component="form" 
      onSubmit={(e) => {
        if (e && typeof e.preventDefault === 'function') {
          e.preventDefault();
        }
        handleSubmit(e);
      }}
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
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.05)',
            borderRadius: 2,
            zIndex: 10,
          }}
        >
          <Typography variant="h6" color="primary">
            Перетащите файлы сюда
          </Typography>
        </Box>
      )}

      {/* Ошибки */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Выбор проекта */}
      {projects && projects.length > 0 && (
        <FormControl fullWidth variant="outlined" size="small" sx={{ mb: 2 }}>
          <InputLabel id="project-select-label">Проект (контекст)</InputLabel>
          <Select
            labelId="project-select-label"
            id="project-select"
            value={selectedProjectId || ''}
            onChange={handleProjectChange}
            label="Проект (контекст)"
            sx={{ borderRadius: 2 }}
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
                  {project.files && project.files.length > 0 && (
                    <Chip 
                      label={`${project.files.length} файлов`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Отображение выбранных файлов */}
      {files.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Прикрепленные файлы ({files.length}):
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

      {/* Индикатор записи */}
      {isRecording && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'error.main',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 },
                },
              }}
            />
            <Typography variant="body2">
              Запись... {formatRecordingTime(recordingTime)}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* Поле ввода сообщения */}
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
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              pr: 1,
            },
          }}
          InputProps={{
            endAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Прикрепить файл">
                  <IconButton
                    onClick={(e) => {
                      if (e && typeof e.stopPropagation === 'function') {
                        e.stopPropagation();
                      }
                      handleFileSelect();
                    }}
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
              px: 3,
              py: 1.5,
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

      {/* Подсказки */}
      <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Enter - отправить, Shift+Enter - новая строка
        </Typography>
        {projects && projects.length > 0 && selectedProjectId && (
          <>
            <span>•</span>
            <Typography variant="caption" color="text.secondary">
              Файлы проекта будут переданы как контекст
            </Typography>
          </>
        )}
      </Box>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default InputArea;