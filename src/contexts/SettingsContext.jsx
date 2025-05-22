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
  backupInterval: 24,
  maxBackups: 10,
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [saveInProgress, setSaveInProgress] = useState(false);

  // Применение темы
  const applyTheme = useCallback((theme) => {
    console.log('Применяем тему:', theme);
    
    if (!theme || theme === 'auto') {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const appliedTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', appliedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, []);

  // Применение настроек интерфейса
  const applyInterfaceSettings = useCallback((currentSettings) => {
    if (!currentSettings) return;

    // Применяем тему
    if (currentSettings.theme) {
      applyTheme(currentSettings.theme);
    }

    // Применяем размер шрифта
    if (currentSettings.fontSize) {
      document.documentElement.style.setProperty('--app-font-size', `${currentSettings.fontSize}px`);
    }

    // Применяем другие настройки интерфейса
    if (currentSettings.compactMode !== undefined) {
      document.documentElement.setAttribute('data-compact-mode', currentSettings.compactMode.toString());
    }

    console.log('Настройки интерфейса применены:', currentSettings);
  }, [applyTheme]);

  // Синхронизация с API handler
  const syncWithAPIHandler = useCallback(async (settingsToSync) => {
    try {
      if (window.electronAPI) {
        // Отправляем настройки в API handler для кеширования
        const result = await window.electronAPI.updateSettings(settingsToSync);
        if (!result.success) {
          console.warn('Не удалось синхронизировать настройки с API handler:', result.error);
        } else {
          console.log('Настройки синхронизированы с API handler');
        }
      }
    } catch (error) {
      console.error('Ошибка синхронизации с API handler:', error);
    }
  }, []);

  // Ожидание electronAPI
  const waitForElectronAPI = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 50;
    
    while (!window.electronAPI && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    const hasAPI = !!window.electronAPI;
    setApiReady(hasAPI);
    return hasAPI;
  }, []);

  // Загрузка настроек
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const hasAPI = await waitForElectronAPI();
      
      if (!hasAPI) {
        console.warn('electronAPI недоступен, используем дефолтные настройки');
        setSettings(defaultSettings);
        applyInterfaceSettings(defaultSettings);
        return;
      }
      
      const savedSettings = await window.electronAPI.getSettings();
      
      if (savedSettings && typeof savedSettings === 'object' && Object.keys(savedSettings).length > 0) {
        // Объединяем с дефолтными настройками
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        
        setSettings(mergedSettings);
        applyInterfaceSettings(mergedSettings);
        
        // Синхронизируем с API handler
        await syncWithAPIHandler(mergedSettings);
        
        console.log('Настройки загружены:', mergedSettings);
      } else {
        setSettings(defaultSettings);
        applyInterfaceSettings(defaultSettings);
        
        // Сохраняем дефолтные настройки
        try {
          await window.electronAPI.updateSettings(defaultSettings);
          await syncWithAPIHandler(defaultSettings);
        } catch (saveError) {
          console.error('Ошибка сохранения дефолтных настроек:', saveError);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError(err.message);
      setSettings(defaultSettings);
      applyInterfaceSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, [waitForElectronAPI, applyInterfaceSettings, syncWithAPIHandler]);

  // Сохранение настроек
  const updateSettings = useCallback(async (newSettings) => {
    // Предотвращаем множественные одновременные вызовы
    if (saveInProgress) {
      console.log('Сохранение уже в процессе, пропускаем...');
      return false;
    }

    try {
      setSaveInProgress(true);
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      // Объединяем с текущими настройками
      const mergedSettings = { ...settings, ...newSettings };
      
      console.log('Сохраняем настройки:', mergedSettings);
      
      // Сохраняем через electron API
      const result = await window.electronAPI.updateSettings(mergedSettings);
      
      if (result && result.success) {
        // Обновляем локальное состояние
        setSettings(mergedSettings);
        
        // Применяем настройки интерфейса немедленно
        applyInterfaceSettings(mergedSettings);
        
        // Синхронизируем с API handler
        await syncWithAPIHandler(mergedSettings);
        
        console.log('Настройки успешно сохранены и применены');
        return true;
      } else {
        throw new Error(result?.error || 'Ошибка сохранения настроек');
      }
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError(err.message);
      return false;
    } finally {
      setSaveInProgress(false);
    }
  }, [settings, apiReady, applyInterfaceSettings, syncWithAPIHandler, saveInProgress]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    try {
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      const result = await window.electronAPI.updateSetting(key, value);
      
      if (result && result.success) {
        setSettings(prev => {
          const updated = { ...prev, [key]: value };
          
          // Если изменили настройки интерфейса, применяем их
          if (['theme', 'fontSize', 'compactMode'].includes(key)) {
            applyInterfaceSettings(updated);
          }
          
          // Синхронизируем с API handler
          syncWithAPIHandler(updated);
          
          return updated;
        });
        
        return true;
      } else {
        throw new Error(result?.error || `Ошибка обновления настройки ${key}`);
      }
    } catch (err) {
      console.error(`Ошибка обновления настройки ${key}:`, err);
      setError(err.message);
      return false;
    }
  }, [apiReady, applyInterfaceSettings, syncWithAPIHandler]);

  // Сброс настроек
  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      const result = await window.electronAPI.resetSettings();
      
      if (result && result.success) {
        setSettings(defaultSettings);
        applyInterfaceSettings(defaultSettings);
        await syncWithAPIHandler(defaultSettings);
        console.log('Настройки сброшены');
        return true;
      } else {
        throw new Error('Ошибка сброса настроек');
      }
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      setError(err.message);
      return false;
    }
  }, [apiReady, applyInterfaceSettings, syncWithAPIHandler]);

  // Загружаем настройки при монтировании
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Слушаем изменения системной темы
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
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [settings.theme, applyTheme]);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    apiReady,
    saveInProgress,
    setError: useCallback((error) => setError(error), []),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};