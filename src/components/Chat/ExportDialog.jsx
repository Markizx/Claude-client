// components/Chat/ExportDialog.jsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Chip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';
import LanguageIcon from '@mui/icons-material/Language';

const ExportDialog = ({ open, onClose, chat }) => {
  const [format, setFormat] = useState('markdown');
  const [loading, setLoading] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const [includeArtifacts, setIncludeArtifacts] = useState(true);

  const formatOptions = [
    {
      value: 'markdown',
      label: 'Markdown',
      description: 'Удобный для чтения и редактирования формат',
      icon: <DescriptionIcon />,
      extension: '.md',
      features: ['Форматирование текста', 'Подсветка кода', 'Артефакты как блоки кода']
    },
    {
      value: 'json',
      label: 'JSON',
      description: 'Полный экспорт данных со всеми метаданными',
      icon: <CodeIcon />,
      extension: '.json',
      features: ['Все метаданные', 'Временные метки', 'Структурированные данные']
    },
    {
      value: 'html',
      label: 'HTML',
      description: 'Для просмотра в браузере с красивым форматированием',
      icon: <LanguageIcon />,
      extension: '.html',
      features: ['Визуальное оформление', 'Готов для печати', 'Интерактивные элементы']
    }
  ];

  const selectedFormat = formatOptions.find(f => f.value === format);

  const handleExport = async () => {
    if (!chat || !window.electronAPI) return;

    setLoading(true);
    setExportStatus('');

    try {
      const result = await window.electronAPI.exportChat(chat.id, format, {
        includeArtifacts
      });
      
      if (result.success) {
        setExportStatus(`Чат успешно экспортирован: ${result.filePath}`);
        
        // Автоматически закрываем диалог через 3 секунды
        setTimeout(() => {
          onClose();
          setExportStatus('');
        }, 3000);
      } else if (result.error) {
        setExportStatus(`Ошибка экспорта: ${result.error}`);
      }
    } catch (error) {
      setExportStatus(`Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setExportStatus('');
      onClose();
    }
  };

  const getEstimatedSize = () => {
    if (!chat) return 'Неизвестно';
    
    // Примерная оценка размера файла
    const messageCount = chat.messageCount || 0;
    let estimatedSize;
    
    switch (format) {
      case 'markdown':
        estimatedSize = messageCount * 500; // ~500 байт на сообщение
        break;
      case 'json':
        estimatedSize = messageCount * 800; // ~800 байт на сообщение
        break;
      case 'html':
        estimatedSize = messageCount * 1200; // ~1200 байт на сообщение
        break;
      default:
        estimatedSize = messageCount * 500;
    }
    
    if (estimatedSize < 1024) {
      return `~${estimatedSize} Б`;
    } else if (estimatedSize < 1024 * 1024) {
      return `~${Math.round(estimatedSize / 1024)} КБ`;
    } else {
      return `~${Math.round(estimatedSize / (1024 * 1024))} МБ`;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DownloadIcon />
          <Typography variant="h6">
            Экспорт чата
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {chat && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {chat.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip 
                size="small" 
                label={`Создан: ${new Date(chat.created_at).toLocaleDateString()}`}
                variant="outlined"
              />
              <Chip 
                size="small" 
                label={`Размер: ${getEstimatedSize()}`}
                variant="outlined"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Экспорт истории сообщений в выбранном формате
            </Typography>
          </Box>
        )}

        <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
          <FormLabel component="legend" sx={{ mb: 2 }}>
            Формат экспорта
          </FormLabel>
          <RadioGroup
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            {formatOptions.map((option) => (
              <Card 
                key={option.value}
                variant="outlined"
                sx={{ 
                  mb: 2, 
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' },
                  ...(format === option.value && {
                    borderColor: 'primary.main',
                    bgcolor: 'action.selected'
                  })
                }}
                onClick={() => setFormat(option.value)}
              >
                <CardContent sx={{ p: 2 }}>
                  <FormControlLabel
                    value={option.value}
                    control={<Radio />}
                    label={
                      <Box sx={{ ml: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {option.icon}
                          <Typography variant="subtitle1" fontWeight="medium">
                            {option.label}
                          </Typography>
                          <Chip 
                            size="small" 
                            label={option.extension}
                            color="primary"
                            variant="outlined"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {option.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {option.features.map((feature) => (
                            <Chip
                              key={feature}
                              size="small"
                              label={feature}
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                    sx={{ margin: 0, alignItems: 'flex-start' }}
                  />
                </CardContent>
              </Card>
            ))}
          </RadioGroup>
        </FormControl>

        {/* Дополнительные опции */}
        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Дополнительные опции
            </Typography>
            <FormControlLabel
              control={
                <Radio
                  checked={includeArtifacts}
                  onChange={(e) => setIncludeArtifacts(e.target.checked)}
                />
              }
              label="Включить артефакты (код, диаграммы, документы)"
            />
          </CardContent>
        </Card>

        {exportStatus && (
          <Alert 
            severity={exportStatus.includes('Ошибка') ? 'error' : 'success'}
            sx={{ mb: 2 }}
          >
            {exportStatus}
          </Alert>
        )}

        {selectedFormat && (
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'info.main', 
              color: 'info.contrastText',
              borderRadius: 1,
              mb: 2
            }}
          >
            <Typography variant="body2">
              <strong>Выбран формат:</strong> {selectedFormat.label} ({selectedFormat.extension})
              <br />
              {selectedFormat.description}
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Отмена
        </Button>
        <Button 
          onClick={handleExport}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
        >
          {loading ? 'Экспорт...' : 'Экспортировать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;