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
  CircularProgress,
  Snackbar,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RestoreIcon from '@mui/icons-material/Restore';
import BackupIcon from '@mui/icons-material/Backup';
import CheckIcon from '@mui/icons-material/Check';
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
  const { 
    settings, 
    updateSettings, 
    resetSettings, 
    error: settingsError, 
    loading: settingsLoading, 
    apiReady,
    saveInProgress 
  } = useSettings();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Локальные копии настроек для редактирования
  const [localSettings, setLocalSettings] = useState({ ...settings });

  // Синхронизация с глобальными настройками при открытии диалога
  useEffect(() => {
    if (open && settings) {
      setLocalSettings({ ...settings });
      setError(null);
      setSuccess(false);
      setHasChanges(false);
    }
  }, [open, settings]);

  // Очистка состояния при закрытии
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccess(false);
      setLoading(false);
      setHasChanges(false);
    }
  }, [open]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleInputChange = (field, value) => {
    setLocalSettings(prev => {
      const newSettings = { ...prev, [field]: value };
      
      // Проверяем, есть ли изменения
      const changed = JSON.stringify(newSettings) !== JSON.stringify(settings);
      setHasChanges(changed);
      
      return newSettings;
    });
    
    // Очищаем ошибки при изменении
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  const handleSwitchChange = (field) => (event) => {
    handleInputChange(field, event.target.checked);
  };

  const handleSelectChange = (field) => (event) => {
    handleInputChange(field, event.target.value);
  };

  const handleSliderChange = (field) => (event, value) => {
    handleInputChange(field, value);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!apiReady) {
        setError('API не готов. Подождите немного и попробуйте снова.');
        return;
      }
      
      console.log('Сохраняем настройки из диалога:', localSettings);
      
      const success = await updateSettings(localSettings);
      
      if (success) {
        setSuccess(true);
        setHasChanges(false);
        setShowSuccessSnackbar(true);
        
        // Автоматически закрываем диалог через 1.5 секунды
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 1500);
      } else {
        setError('Не удалось сохранить настройки');
      }
    } catch (err) {
      console.error('Ошибка при сохранении настроек:', err);
      setError(`Ошибка сохранения: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      if (!window.confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      if (!apiReady) {
        setError('API не готов. Подождите немного и попробуйте снова.');
        return;
      }
      
      const success = await resetSettings();
      
      if (success) {
        // Обновляем локальные настройки
        setLocalSettings({ ...settings });
        setHasChanges(false);
        setSuccess(true);
        setShowSuccessSnackbar(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Не удалось сбросить настройки');
      }
    } catch (err) {
      console.error('Ошибка при сбросе настроек:', err);
      setError(`Ошибка сброса: ${err.message}`);
    } finally {
      setLoading(false);
    }
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
          setShowSuccessSnackbar(true);
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
    if (hasChanges) {
      const shouldDiscard = window.confirm('У вас есть несохраненные изменения. Закрыть без сохранения?');
      if (!shouldDiscard) return;
    }
    
    // Сбрасываем локальные изменения при закрытии без сохранения
    setLocalSettings({ ...settings });
    setError(null);
    setSuccess(false);
    setHasChanges(false);
    onClose();
  };

  const availableModels = [
    { value: 'claude-3-7-sonnet-20250219', label: 'Claude 3.7 Sonnet (рекомендуется)' },
    { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (быстрая)' },
  ];

  return (
    <>
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
          {!apiReady && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              API не готов. Подождите несколько секунд...
            </Alert>
          )}
          
          {success && (
            <Alert 
              severity="success" 
              sx={{ mb: 2 }}
              icon={<CheckIcon fontSize="inherit" />}
            >
              Настройки успешно сохранены!
            </Alert>
          )}
          
          {(error || settingsError) && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error || settingsError}
            </Alert>
          )}

          {settingsLoading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                Загрузка настроек...
              </Box>
            </Alert>
          )}

          {hasChanges && (
            <Alert severity="info" sx={{ mb: 2 }}>
              У вас есть несохраненные изменения
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
                  value={localSettings.language || 'ru'}
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
                  value={localSettings.theme || 'dark'}
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
                    checked={localSettings.autoSave !== false}
                    onChange={handleSwitchChange('autoSave')}
                  />
                }
                label="Автоматическое сохранение"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.confirmDelete !== false}
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
                  value={localSettings.model || 'claude-3-7-sonnet-20250219'}
                  label="Модель"
                  onChange={handleSelectChange('model')}
                >
                  {availableModels.map(model => (
                    <MenuItem key={model.value} value={model.value}>
                      {model.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                type="number"
                label="Максимум токенов"
                value={localSettings.maxTokens || 4096}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value) || 4096)}
                inputProps={{ min: 1, max: 8192 }}
                sx={{ mb: 3 }}
              />

              <Typography gutterBottom>
                Температура: {localSettings.temperature || 0.7}
              </Typography>
              <Slider
                value={localSettings.temperature || 0.7}
                onChange={handleSliderChange('temperature')}
                min={0}
                max={2}
                step={0.1}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <Typography gutterBottom>
                Top P: {localSettings.topP || 1.0}
              </Typography>
              <Slider
                value={localSettings.topP || 1.0}
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
                    checked={localSettings.messageAnimation !== false}
                    onChange={handleSwitchChange('messageAnimation')}
                  />
                }
                label="Анимация сообщений"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.compactMode === true}
                    onChange={handleSwitchChange('compactMode')}
                  />
                }
                label="Компактный режим"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.showTimestamps !== false}
                    onChange={handleSwitchChange('showTimestamps')}
                  />
                }
                label="Показывать время сообщений"
                sx={{ mb: 3 }}
              />

              <Typography gutterBottom sx={{ mt: 3 }}>
                Размер шрифта: {localSettings.fontSize || 14}px
              </Typography>
              <Slider
                value={localSettings.fontSize || 14}
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
                    checked={localSettings.soundEnabled !== false}
                    onChange={handleSwitchChange('soundEnabled')}
                  />
                }
                label="Звуковые уведомления"
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.desktopNotifications !== false}
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
                    disabled={loading || !apiReady}
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
                    disabled={loading || !apiReady}
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
                    checked={localSettings.autoBackup === true}
                    onChange={handleSwitchChange('autoBackup')}
                  />
                }
                label="Автоматическое создание резервных копий"
                sx={{ mb: 2 }}
              />

              {localSettings.autoBackup && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    type="number"
                    label="Интервал резервного копирования (часы)"
                    value={localSettings.backupInterval || 24}
                    onChange={(e) => handleInputChange('backupInterval', parseInt(e.target.value) || 24)}
                    inputProps={{ min: 1, max: 168 }}
                    sx={{ mr: 2, minWidth: 200 }}
                  />
                  
                  <TextField
                    type="number"
                    label="Максимум резервных копий"
                    value={localSettings.maxBackups || 10}
                    onChange={(e) => handleInputChange('maxBackups', parseInt(e.target.value) || 10)}
                    inputProps={{ min: 1, max: 50 }}
                    sx={{ minWidth: 200 }}
                  />
                </Box>
              )}
            </Box>
          </TabPanel>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleReset} 
            startIcon={<RestoreIcon />} 
            disabled={loading || !apiReady || saveInProgress}
          >
            Сбросить
          </Button>
          <Button onClick={handleClose} disabled={loading || saveInProgress}>
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            startIcon={loading || saveInProgress ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={loading || settingsLoading || !apiReady || saveInProgress || !hasChanges}
          >
            {loading || saveInProgress ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar для уведомлений */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          Настройки успешно сохранены!
        </Alert>
      </Snackbar>
    </>
  );
};

export default SettingsDialog;