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

  // Загрузка настроек при инициализации
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (window.electronAPI && window.electronAPI.getSettings) {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const savedSettings = await window.electronAPI.getSettings();
        
        if (savedSettings && typeof savedSettings === 'object') {
          // Мерджим с дефолтными настройками
          setSettings(prevSettings => ({
            ...prevSettings,
            ...savedSettings
          }));
          
          // Принудительно устанавливаем модель по умолчанию
          if (!savedSettings.model || savedSettings.model !== 'claude-3-7-sonnet-20250219') {
            updateSetting('model', 'claude-3-7-sonnet-20250219');
          }
          
          // Применяем тему
          applyTheme(savedSettings.theme || prevSettings.theme);
        } else {
          // Если сохраненные настройки не найдены, сохраняем дефолтные
          await updateSettings(defaultSettings);
        }
      } else {
        // Пробуем загрузить из localStorage для веб-версии
        const stored = localStorage.getItem('claude-desktop-settings');
        if (stored) {
          try {
            const parsedSettings = JSON.parse(stored);
            setSettings(prevSettings => ({
              ...prevSettings,
              ...parsedSettings
            }));
            
            // Применяем тему
            applyTheme(parsedSettings.theme || prevSettings.theme);
          } catch (e) {
            console.error('Error parsing settings from localStorage:', e);
          }
        } else {
          // Если настройки не найдены, инициализируем дефолтными
          localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
          setSettings(defaultSettings);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Ошибка загрузки настроек: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Сохранение настроек
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setError(null);
      
      // Проверяем наличие null/undefined значений и заменяем их пустой строкой
      const cleanSettings = {};
      for (const [key, value] of Object.entries({...settings, ...newSettings})) {
        cleanSettings[key] = value === null || value === undefined ? '' : value;
      }

      // Всегда устанавливаем правильную модель
      cleanSettings.model = cleanSettings.model || 'claude-3-7-sonnet-20250219';

      if (window.electronAPI && window.electronAPI.updateSettings) {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const result = await window.electronAPI.updateSettings(cleanSettings);
        
        if (result && result.success) {
          setSettings(cleanSettings);
          
          // Применяем тему
          applyTheme(cleanSettings.theme);
          
          return true;
        } else if (result && result.error) {
          setError(result.error);
          return false;
        }
      } else {
        // Сохраняем в localStorage для веб-версии
        localStorage.setItem('claude-desktop-settings', JSON.stringify(cleanSettings));
        setSettings(cleanSettings);
        
        // Применяем тему
        applyTheme(cleanSettings.theme);
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    // Проверяем наличие null/undefined значений
    const safeValue = value === null || value === undefined ? '' : value;
    
    if (window.electronAPI && window.electronAPI.updateSetting) {
      try {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const result = await window.electronAPI.updateSetting(key, safeValue);
        if (result && result.success) {
          setSettings(prev => {
            const updated = { ...prev, [key]: safeValue };
            
            // Если обновили тему, применяем её
            if (key === 'theme') {
              applyTheme(safeValue);
            }
            
            return updated;
          });
          return true;
        }
        return false;
      } catch (error) {
        console.error(`Ошибка обновления настройки ${key}:`, error);
        return false;
      }
    } else {
      return await updateSettings({ [key]: safeValue });
    }
  }, [updateSettings]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      await updateSettings(defaultSettings);
      return true;
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      return false;
    }
  }, [updateSettings]);

  // Функция для применения темы
  const applyTheme = (theme) => {
    if (!theme || theme === 'auto') {
      // Автоматический выбор в зависимости от системных предпочтений
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  // Загружаем настройки при монтировании
  useEffect(() => {
    let mounted = true;
    
    const loadWithDelay = async () => {
      // Ждем доступности electronAPI
      let attempts = 0;
      const maxAttempts = 50; // 5 секунд ожидания
      
      while (attempts < maxAttempts && !window.electronAPI && mounted) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (mounted) {
        await loadSettings();
      }
    };

    loadWithDelay();

    // Добавляем слушатель для изменений системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (settings.theme === 'auto' && mounted) {
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
      mounted = false;
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Для старых браузеров
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [loadSettings, settings.theme]);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    setError,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};