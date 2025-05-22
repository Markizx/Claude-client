import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  // Основные настройки
  language: 'ru',
  theme: 'dark',
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
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiReady, setApiReady] = useState(false);

  // Ожидание electronAPI
  const waitForElectronAPI = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 100; // 10 секунд ожидания
    
    while (!window.electronAPI && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    const hasAPI = !!window.electronAPI;
    setApiReady(hasAPI);
    console.log('SettingsContext: electronAPI ready:', hasAPI);
    return hasAPI;
  }, []);

  // Загрузка настроек при инициализации
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('SettingsContext: Начинаем загрузку настроек...');
      
      // Ждем доступности electronAPI
      const hasAPI = await waitForElectronAPI();
      
      if (!hasAPI) {
        console.warn('SettingsContext: electronAPI не доступен, используем дефолтные настройки');
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        return;
      }
      
      console.log('SettingsContext: electronAPI доступен, загружаем настройки...');
      const savedSettings = await window.electronAPI.getSettings();
      
      console.log('SettingsContext: Полученные настройки:', savedSettings);
      
      if (savedSettings && typeof savedSettings === 'object' && Object.keys(savedSettings).length > 0) {
        // Мерджим с дефолтными настройками
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        
        // Принудительно устанавливаем правильную модель
        if (!mergedSettings.model || mergedSettings.model !== 'claude-3-7-sonnet-20250219') {
          mergedSettings.model = 'claude-3-7-sonnet-20250219';
          console.log('SettingsContext: Принудительно установлена модель claude-3-7-sonnet-20250219');
        }
        
        setSettings(mergedSettings);
        applyTheme(mergedSettings.theme);
        
        console.log('SettingsContext: Настройки успешно загружены и применены:', mergedSettings);
        
        // Уведомляем API handler об обновлении настроек если он доступен
        notifyAPIHandlerSettingsUpdate(mergedSettings);
      } else {
        console.log('SettingsContext: Настройки не найдены или пусты, используем дефолтные');
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        
        // Сохраняем дефолтные настройки
        try {
          await window.electronAPI.updateSettings(defaultSettings);
          console.log('SettingsContext: Дефолтные настройки сохранены');
          notifyAPIHandlerSettingsUpdate(defaultSettings);
        } catch (saveError) {
          console.error('SettingsContext: Ошибка сохранения дефолтных настроек:', saveError);
        }
      }
    } catch (err) {
      console.error('SettingsContext: Ошибка загрузки настроек:', err);
      setError('Ошибка загрузки настроек: ' + (err.message || err));
      setSettings(defaultSettings);
      applyTheme(defaultSettings.theme);
    } finally {
      setLoading(false);
    }
  }, [waitForElectronAPI]);

  // Уведомление API handler об изменении настроек
  const notifyAPIHandlerSettingsUpdate = useCallback((newSettings) => {
    try {
      // Создаем специальное сообщение для передачи настроек в main process
      if (window.electronAPI && window.electronAPI.updateSetting) {
        // Передаем настройки через специальный канал
        console.log('SettingsContext: Уведомляем API handler о новых настройках');
        
        // Отправляем каждую настройку отдельно для надежности
        const criticalSettings = ['model', 'maxTokens', 'temperature', 'topP'];
        criticalSettings.forEach(key => {
          if (newSettings[key] !== undefined) {
            window.electronAPI.updateSetting(key, newSettings[key]).catch(err => {
              console.error(`SettingsContext: Ошибка обновления настройки ${key}:`, err);
            });
          }
        });
      }
    } catch (err) {
      console.error('SettingsContext: Ошибка уведомления API handler:', err);
    }
  }, []);

  // Сохранение всех настроек
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setError(null);
      
      console.log('SettingsContext: Обновляем настройки:', newSettings);
      
      if (!apiReady) {
        console.warn('SettingsContext: electronAPI не готов');
        setError('API не готов. Подождите и попробуйте снова.');
        return false;
      }
      
      // Объединяем текущие настройки с новыми
      const mergedSettings = { ...settings, ...newSettings };
      
      // Принудительно устанавливаем правильную модель
      mergedSettings.model = 'claude-3-7-sonnet-20250219';
      
      console.log('SettingsContext: Сохраняем настройки через electronAPI:', mergedSettings);
      
      const result = await window.electronAPI.updateSettings(mergedSettings);
      
      console.log('SettingsContext: Результат сохранения:', result);
      
      if (result && result.success) {
        setSettings(mergedSettings);
        applyTheme(mergedSettings.theme);
        
        // Уведомляем API handler
        notifyAPIHandlerSettingsUpdate(mergedSettings);
        
        console.log('SettingsContext: Настройки успешно сохранены и применены');
        return true;
      } else {
        const errorMsg = result?.error || 'Неизвестная ошибка при сохранении';
        setError(errorMsg);
        console.error('SettingsContext: Ошибка при сохранении настроек:', errorMsg);
        return false;
      }
    } catch (err) {
      console.error('SettingsContext: Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings, apiReady, notifyAPIHandlerSettingsUpdate]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    try {
      console.log(`SettingsContext: Обновляем настройку ${key}:`, value);
      
      if (!apiReady) {
        console.warn('SettingsContext: electronAPI не готов');
        setError('API не готов. Подождите и попробуйте снова.');
        return false;
      }
      
      const result = await window.electronAPI.updateSetting(key, value);
      
      console.log(`SettingsContext: Результат обновления настройки ${key}:`, result);
      
      if (result && result.success) {
        setSettings(prev => {
          const updated = { ...prev, [key]: value };
          
          // Если обновили тему, применяем её
          if (key === 'theme') {
            applyTheme(value);
          }
          
          // Уведомляем API handler о критических настройках
          const criticalSettings = ['model', 'maxTokens', 'temperature', 'topP'];
          if (criticalSettings.includes(key)) {
            notifyAPIHandlerSettingsUpdate(updated);
          }
          
          console.log('SettingsContext: Настройки в состоянии обновлены:', updated);
          return updated;
        });
        return true;
      }
      
      console.error(`SettingsContext: Ошибка обновления настройки ${key}:`, result);
      setError(`Ошибка обновления настройки ${key}`);
      return false;
    } catch (error) {
      console.error(`SettingsContext: Ошибка обновления настройки ${key}:`, error);
      setError(`Ошибка обновления настройки ${key}: ${error.message}`);
      return false;
    }
  }, [apiReady, notifyAPIHandlerSettingsUpdate]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('SettingsContext: Сбрасываем настройки к значениям по умолчанию');
      
      if (!apiReady) {
        console.warn('SettingsContext: electronAPI не готов');
        setError('API не готов. Подождите и попробуйте снова.');
        return false;
      }
      
      const result = await window.electronAPI.resetSettings();
      console.log('SettingsContext: Результат сброса настроек:', result);
      
      if (result && result.success) {
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        
        // Уведомляем API handler
        notifyAPIHandlerSettingsUpdate(defaultSettings);
        
        console.log('SettingsContext: Настройки сброшены к значениям по умолчанию');
        return true;
      } else {
        setError('Ошибка сброса настроек');
        return false;
      }
    } catch (err) {
      console.error('SettingsContext: Ошибка сброса настроек:', err);
      setError('Ошибка сброса настроек: ' + (err.message || err));
      return false;
    }
  }, [apiReady, notifyAPIHandlerSettingsUpdate]);

  // Функция для применения темы
  const applyTheme = useCallback((theme) => {
    console.log('SettingsContext: Применяем тему:', theme);
    
    if (!theme || theme === 'auto') {
      // Автоматический выбор в зависимости от системных предпочтений
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const appliedTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', appliedTheme);
      console.log('SettingsContext: Применена автоматическая тема:', appliedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      console.log('SettingsContext: Применена тема:', theme);
    }
  }, []);

  // Загружаем настройки при монтировании
  useEffect(() => {
    let mounted = true;
    
    const loadWithDelay = async () => {
      // Ждем полной загрузки DOM
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve();
          } else {
            window.addEventListener('load', resolve, { once: true });
          }
        });
      }
      
      if (mounted) {
        await loadSettings();
      }
    };

    loadWithDelay();

    return () => {
      mounted = false;
    };
  }, [loadSettings]);

  // Применяем тему при изменении настроек темы
  useEffect(() => {
    if (settings.theme && !loading) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, loading, applyTheme]);

  // Слушатель для изменений системной темы
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'auto') {
        applyTheme('auto');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Для старых браузеров
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Для старых браузеров
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [settings.theme, applyTheme]);

  // Дополнительный эффект для мониторинга изменений критических настроек
  useEffect(() => {
    const criticalSettings = ['model', 'maxTokens', 'temperature', 'topP'];
    const hasCriticalChanges = criticalSettings.some(key => settings[key] !== undefined);
    
    if (hasCriticalChanges && !loading && apiReady) {
      console.log('SettingsContext: Обнаружены изменения критических настроек, уведомляем API handler');
      notifyAPIHandlerSettingsUpdate(settings);
    }
  }, [settings.model, settings.maxTokens, settings.temperature, settings.topP, loading, apiReady, notifyAPIHandlerSettingsUpdate]);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    apiReady,
    setError: useCallback((error) => setError(error), []),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};