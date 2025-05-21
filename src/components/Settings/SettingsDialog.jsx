import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Slider,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import BackupIcon from '@mui/icons-material/Backup';
import { useSettings } from '../../contexts/SettingsContext';

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`settings-tabpanel-${index}`}
    aria-labelledby={`settings-tab-${index}`}
    {...other}
  >
    {value === index && (
      <Box sx={{ py: 3 }}>
        {children}
      </Box>
    )}
  </div>
);

const SettingsDialog = ({ open, onClose }) => {
  const { settings, updateSettings, resetSettings, error: settingsError } = useSettings();
  
  const [activeTab, setActiveTab] = useState(0);
  const [localSettings, setLocalSettings] = useState({
    // Основные настройки
    language: 'ru',
    theme: 'light',
    autoSave: true,
    confirmDelete: true,
    
    // Настройки AI
    model: 'claude-3-7-sonnet-20250219',
    maxTokens: 4096,
    temperature: 0.7,
    topP: 1.0,
    
    // Интерфейс
    messageAnimation: true,
    compactMode: false,
    showTimestamps: true,
    fontSize: 14,
    
    // Уведомления
    soundEnabled: true,
    desktopNotifications: true,
    
    // Резервное копирование
    autoBackup: false,
    backupInterval: 24, // часы
    maxBackups: 10,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Загрузка настроек при открытии диалога
  useEffect(() => {
    if (open && settings) {
      // КРИТИЧНОЕ ИСПРАВЛЕНИЕ: всегда принудительно устанавливаем модель
      const settingsWithFixedModel = {
        ...settings,
        model: 'claude-3-7-sonnet-20250219'
      };
      
      setLocalSettings(settingsWithFixedModel);
      console.log('Настройки загружены в диалог:', settingsWithFixedModel);
    }
  }, [open, settings]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    // Для модели всегда принудительно устанавливаем единственно верное значение
    if (field === 'model') {
      value = 'claude-3-7-sonnet-20250219';
      console.log('Попытка изменения модели заблокирована, используется фиксированная модель');
    }
    
    setLocalSettings({
      ...localSettings,
      [field]: value
    });
  };

  const handleSwitchChange = (field) => (event) => {
    handleInputChange(field, event.target.checked);
  };

  const handleSelectChange = (field) => (event) => {
    // Для модели блокируем изменение
    if (field === 'model') {
      console.log('Попытка изменения модели через select заблокирована');
      return;
    }
    
    handleInputChange(field, event.target.value);
  };
  
  // Специальный обработчик для выбора модели (всегда лишь одна модель)
  const handleModelChange = (event) => {
    console.log('Попытка изменить модель игнорируется, установлена фиксированная модель');
    // Принудительно устанавливаем только claude-3-7-sonnet
    handleInputChange('model', 'claude-3-7-sonnet-20250219');
  };

  const handleSliderChange = (field) => (event, value) => {
    handleInputChange(field, value);
  };

  const handleSave = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Гарантируем, что модель всегда claude-3-7-sonnet
    const settingsToSave = {
      ...localSettings,
      model: 'claude-3-7-sonnet-20250219'
    };
    
    console.log('Сохранение настроек с принудительной моделью Claude 3.7 Sonnet:', settingsToSave);
    
    // Добавляем повторные попытки
    let success = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!success && attempts < maxAttempts) {
      attempts++;
      try {
        success = await updateSettings(settingsToSave);
        
        if (success) {
          // После успешного сохранения, обновляем тему в DOM
          document.documentElement.setAttribute('data-theme', settingsToSave.theme || 'light');
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
          break;
        } else {
          console.warn(`Попытка ${attempts}: Не удалось сохранить настройки`);
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (attemptError) {
        console.error(`Попытка ${attempts} сохранения настроек завершилась ошибкой:`, attemptError);
        if (attempts === maxAttempts) {
          throw attemptError;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (!success) {
      setError('Не удалось сохранить настройки после нескольких попыток');
    }
  } catch (err) {
    setError(`Ошибка сохранения настроек: ${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    // Сбрасываем локальные настройки к значениям по умолчанию
    // Но сохраняем фиксированную модель!
    setLocalSettings({
      language: 'ru',
      theme: 'light',
      autoSave: true,
      confirmDelete: true,
      model: 'claude-3-7-sonnet-20250219', // Фиксированная!
      maxTokens: 4096,
      temperature: 0.7,
      topP: 1.0,
      messageAnimation: true,
      compactMode: false,
      showTimestamps: true,
      fontSize: 14,
      soundEnabled: true,
      desktopNotifications: true,
      autoBackup: false,
      backupInterval: 24,
      maxBackups: 10,
    });
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      if (!window.electronAPI) {
        setError('Функция создания резервной копии недоступна');
        return;
      }
      
      const backupPath = await window.electronAPI.saveFileDialog(
        `claude-backup-${new Date().toISOString().split('T')[0]}.db`,
        [{ name: 'Database files', extensions: ['db'] }]
      );
      
      if (backupPath && backupPath.filePath) {
        const result = await window.electronAPI.backupDatabase(backupPath.filePath);
        if (result && result.success) {
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } else {
          setError(result?.error || 'Ошибка создания резервной копии');
        }
      }
    } catch (err) {
      setError(`Ошибка создания резервной копии: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      if (!window.electronAPI) {
        setError('Функция восстановления из резервной копии недоступна');
        return;
      }
      
      const result = await window.electronAPI.openFileDialog({
        properties: ['openFile'],
        filters: [{ name: 'Database files', extensions: ['db'] }]
      });
      
      if (result && result.success && result.files && result.files.length > 0) {
        // Запрашиваем подтверждение восстановления
        const confirmed = window.confirm(
          'Восстановление базы данных перезапишет все текущие данные. Продолжить?'
        );
        
        if (confirmed) {
          setLoading(true);
          const restoreResult = await window.electronAPI.restoreDatabase(result.files[0].path);
          
          if (restoreResult && restoreResult.success) {
            setSuccess(true);
            alert('База данных восстановлена. Приложение будет перезапущено.');
            await window.electronAPI.restartApp?.();
          } else {
            setError(restoreResult?.error || 'Ошибка восстановления базы данных');
          }
        }
      }
    } catch (err) {
      setError(`Ошибка восстановления базы данных: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  // Доступные модели Claude
  const availableModels = [
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet' },
    { value: 'claude-3-5-sonnet-20240620', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ];

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '70vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Настройки</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Настройки успешно сохранены!
          </Alert>
        )}
        
        {(error || settingsError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || settingsError}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Основные" />
            <Tab label="AI модель" />
            <Tab label="Интерфейс" />
            <Tab label="Резервные копии" />
          </Tabs>
        </Box>

        {/* Основные настройки */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ space: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="language-label">Язык интерфейса</InputLabel>
              <Select
                labelId="language-label"
                value={localSettings.language}
                label="Язык интерфейса"
                onChange={handleSelectChange('language')}
              >
                <MenuItem value="ru">Русский</MenuItem>
                <MenuItem value="en">English</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="theme-label">Тема</InputLabel>
              <Select
                labelId="theme-label"
                value={localSettings.theme}
                label="Тема"
                onChange={handleSelectChange('theme')}
              >
                <MenuItem value="light">Светлая</MenuItem>
                <MenuItem value="dark">Темная</MenuItem>
                <MenuItem value="auto">Автоматически</MenuItem>
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.autoSave}
                  onChange={handleSwitchChange('autoSave')}
                />
              }
              label="Автоматическое сохранение"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.confirmDelete}
                  onChange={handleSwitchChange('confirmDelete')}
                />
              }
              label="Подтверждение при удалении"
            />
          </Box>
        </TabPanel>

        {/* Настройки AI */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ space: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="model-label">Модель</InputLabel>
              <Select
                labelId="model-label"
                value={'claude-3-7-sonnet-20250219'} // Принудительно отображаем только эту модель
                label="Модель"
                onChange={handleModelChange}
                disabled={true} // Блокируем выбор - всегда только одна модель
              >
                <MenuItem value={'claude-3-7-sonnet-20250219'}>
                  Claude 3.7 Sonnet
                </MenuItem>
              </Select>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                Модель фиксирована на Claude 3.7 Sonnet для оптимальной работы приложения
              </Typography>
            </FormControl>

            <TextField
              fullWidth
              type="number"
              label="Максимум токенов"
              value={localSettings.maxTokens}
              onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
              inputProps={{ min: 1, max: 8192 }}
              sx={{ mb: 3 }}
            />

            <Typography gutterBottom>
              Температура: {localSettings.temperature}
            </Typography>
            <Slider
              value={localSettings.temperature}
              onChange={handleSliderChange('temperature')}
              min={0}
              max={2}
              step={0.1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <Typography gutterBottom>
              Top P: {localSettings.topP}
            </Typography>
            <Slider
              value={localSettings.topP}
              onChange={handleSliderChange('topP')}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />
          </Box>
        </TabPanel>

        {/* Настройки интерфейса */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ space: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.messageAnimation}
                  onChange={handleSwitchChange('messageAnimation')}
                />
              }
              label="Анимация сообщений"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.compactMode}
                  onChange={handleSwitchChange('compactMode')}
                />
              }
              label="Компактный режим"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.showTimestamps}
                  onChange={handleSwitchChange('showTimestamps')}
                />
              }
              label="Показывать время сообщений"
            />

            <Typography gutterBottom sx={{ mt: 3 }}>
              Размер шрифта: {localSettings.fontSize}px
            </Typography>
            <Slider
              value={localSettings.fontSize}
              onChange={handleSliderChange('fontSize')}
              min={12}
              max={20}
              step={1}
              marks
              valueLabelDisplay="auto"
              sx={{ mb: 3 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.soundEnabled}
                  onChange={handleSwitchChange('soundEnabled')}
                />
              }
              label="Звуковые уведомления"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.desktopNotifications}
                  onChange={handleSwitchChange('desktopNotifications')}
                />
              }
              label="Уведомления на рабочем столе"
            />
          </Box>
        </TabPanel>

        {/* Резервные копии */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ space: 3 }}>
            <Typography variant="h6" gutterBottom>
              Управление резервными копиями
            </Typography>
            
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Создать резервную копию
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Сохранить все данные приложения в отдельный файл
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<BackupIcon />}
                  onClick={handleBackup}
                  disabled={loading}
                >
                  Создать резервную копию
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Восстановить из резервной копии
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Восстановить данные из ранее созданной резервной копии
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<RestoreIcon />}
                  onClick={handleRestore}
                  disabled={loading}
                  color="warning"
                >
                  Восстановить
                </Button>
              </CardContent>
            </Card>

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={
                <Switch
                  checked={localSettings.autoBackup}
                  onChange={handleSwitchChange('autoBackup')}
                />
              }
              label="Автоматическое создание резервных копий"
            />

            {localSettings.autoBackup && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  type="number"
                  label="Интервал резервного копирования (часы)"
                  value={localSettings.backupInterval}
                  onChange={(e) => handleInputChange('backupInterval', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 168 }}
                  sx={{ mr: 2, minWidth: 200 }}
                />
                
                <TextField
                  type="number"
                  label="Максимум резервных копий"
                  value={localSettings.maxBackups}
                  onChange={(e) => handleInputChange('maxBackups', parseInt(e.target.value))}
                  inputProps={{ min: 1, max: 50 }}
                  sx={{ minWidth: 200 }}
                />
              </Box>
            )}
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} startIcon={<RestoreIcon />}>
          Сбросить
        </Button>
        <Button onClick={handleClose}>
          Отмена
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          disabled={loading}
        >
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SettingsDialog;