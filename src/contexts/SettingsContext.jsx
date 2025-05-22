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
    
    setApiReady(!!window.electronAPI);
    return !!window.electronAPI;
  }, []);

  // Загрузка настроек при инициализации
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Начинаем загрузку настроек...');
      
      // Ждем доступности electronAPI
      const hasAPI = await waitForElectronAPI();
      
      if (!hasAPI) {
        console.warn('electronAPI не доступен, используем дефолтные настройки');
        setSettings(defaultSettings);
        return;
      }
      
      console.log('electronAPI доступен, загружаем настройки...');
      const savedSettings = await window.electronAPI.getSettings();
      
      console.log('Полученные настройки:', savedSettings);
      
      if (savedSettings && typeof savedSettings === 'object') {
        // Мерджим с дефолтными настройками
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        
        // Принудительно устанавливаем правильную модель
        if (!mergedSettings.model || mergedSettings.model !== 'claude-3-7-sonnet-20250219') {
          mergedSettings.model = 'claude-3-7-sonnet-20250219';
        }
        
        setSettings(mergedSettings);
        applyTheme(mergedSettings.theme);
        
        console.log('Настройки успешно загружены и применены:', mergedSettings);
      } else {
        console.log('Настройки не найдены, используем дефолтные');
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Ошибка загрузки настроек: ' + (err.message || err));
      setSettings(defaultSettings);
      applyTheme(defaultSettings.theme);
    } finally {
      setLoading(false);
    }
  }, [waitForElectronAPI]);

  // Сохранение всех настроек
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setError(null);
      
      console.log('Обновляем настройки:', newSettings);
      
      if (!apiReady) {
        console.warn('electronAPI не готов');
        return false;
      }
      
      // Объединяем текущие настройки с новыми
      const mergedSettings = { ...settings, ...newSettings };
      
      // Принудительно устанавливаем правильную модель
      mergedSettings.model = 'claude-3-7-sonnet-20250219';
      
      console.log('Сохраняем настройки через electronAPI:', mergedSettings);
      
      const result = await window.electronAPI.updateSettings(mergedSettings);
      
      console.log('Результат сохранения:', result);
      
      if (result && result.success) {
        setSettings(mergedSettings);
        applyTheme(mergedSettings.theme);
        
        console.log('Настройки успешно сохранены и применены');
        return true;
      } else {
        const errorMsg = result?.error || 'Неизвестная ошибка при сохранении';
        setError(errorMsg);
        console.error('Ошибка при сохранении настроек:', errorMsg);
        return false;
      }
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings, apiReady]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    try {
      console.log(`Обновляем настройку ${key}:`, value);
      
      if (!apiReady) {
        console.warn('electronAPI не готов');
        return false;
      }
      
      const result = await window.electronAPI.updateSetting(key, value);
      
      console.log(`Результат обновления настройки ${key}:`, result);
      
      if (result && result.success) {
        setSettings(prev => {
          const updated = { ...prev, [key]: value };
          
          // Если обновили тему, применяем её
          if (key === 'theme') {
            applyTheme(value);
          }
          
          console.log('Настройки в состоянии обновлены:', updated);
          return updated;
        });
        return true;
      }
      
      console.error(`Ошибка обновления настройки ${key}:`, result);
      return false;
    } catch (error) {
      console.error(`Ошибка обновления настройки ${key}:`, error);
      setError(`Ошибка обновления настройки ${key}: ${error.message}`);
      return false;
    }
  }, [apiReady]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('Сбрасываем настройки к значениям по умолчанию');
      
      if (!apiReady) {
        console.warn('electronAPI не готов');
        return false;
      }
      
      const result = await window.electronAPI.resetSettings();
      console.log('Результат сброса настроек:', result);
      
      if (result && result.success) {
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        return true;
      } else {
        setError('Ошибка сброса настроек');
        return false;
      }
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      setError('Ошибка сброса настроек: ' + (err.message || err));
      return false;
    }
  }, [apiReady]);

  // Функция для применения темы
  const applyTheme = useCallback((theme) => {
    console.log('Применяем тему:', theme);
    
    if (!theme || theme === 'auto') {
      // Автоматический выбор в зависимости от системных предпочтений
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const appliedTheme = prefersDark ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', appliedTheme);
      console.log('Применена автоматическая тема:', appliedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', theme);
      console.log('Применена тема:', theme);
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