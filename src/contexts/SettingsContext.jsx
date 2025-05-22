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
      
      // Ждем доступности electronAPI
      let attempts = 0;
      const maxAttempts = 50; // 5 секунд ожидания
      
      while (!window.electronAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (window.electronAPI && window.electronAPI.getSettings) {
        try {
          const savedSettings = await window.electronAPI.getSettings();
          
          if (savedSettings && typeof savedSettings === 'object') {
            // Мерджим с дефолтными настройками
            const mergedSettings = {
              ...defaultSettings,
              ...savedSettings
            };
            
            setSettings(mergedSettings);
            
            // Применяем тему
            applyTheme(mergedSettings.theme);
            
            console.log('Настройки загружены:', mergedSettings);
          } else {
            // Если сохраненные настройки не найдены, сохраняем дефолтные
            console.log('Настройки не найдены, используем дефолтные');
            setSettings(defaultSettings);
            applyTheme(defaultSettings.theme);
            await updateSettings(defaultSettings);
          }
        } catch (settingsError) {
          console.error('Ошибка загрузки настроек из API:', settingsError);
          setSettings(defaultSettings);
          applyTheme(defaultSettings.theme);
        }
      } else {
        // Пробуем загрузить из localStorage для веб-версии или если API недоступен
        try {
          const stored = localStorage.getItem('claude-desktop-settings');
          if (stored) {
            const parsedSettings = JSON.parse(stored);
            const mergedSettings = {
              ...defaultSettings,
              ...parsedSettings
            };
            setSettings(mergedSettings);
            applyTheme(mergedSettings.theme);
            console.log('Настройки загружены из localStorage:', mergedSettings);
          } else {
            // Если настройки не найдены, инициализируем дефолтными
            localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
            setSettings(defaultSettings);
            applyTheme(defaultSettings.theme);
            console.log('Инициализированы дефолтные настройки');
          }
        } catch (localStorageError) {
          console.error('Ошибка работы с localStorage:', localStorageError);
          setSettings(defaultSettings);
          applyTheme(defaultSettings.theme);
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Ошибка загрузки настроек: ' + (err.message || err));
      // В случае ошибки используем дефолтные настройки
      setSettings(defaultSettings);
      applyTheme(defaultSettings.theme);
    } finally {
      setLoading(false);
    }
  }, []);

  // Сохранение настроек
  const updateSettings = useCallback(async (newSettings) => {
    try {
      setError(null);
      
      // Проверяем наличие null/undefined значений и заменяем их дефолтными
      const cleanSettings = {};
      for (const [key, value] of Object.entries({...settings, ...newSettings})) {
        if (value === null || value === undefined) {
          cleanSettings[key] = defaultSettings[key] || '';
        } else {
          cleanSettings[key] = value;
        }
      }

      // Всегда устанавливаем правильную модель если её нет
      if (!cleanSettings.model) {
        cleanSettings.model = defaultSettings.model;
      }

      console.log('Сохраняем настройки:', cleanSettings);

      // Сначала обновляем локальное состояние
      setSettings(cleanSettings);
      
      // Применяем тему
      applyTheme(cleanSettings.theme);

      // Сохраняем через API если доступно
      if (window.electronAPI && window.electronAPI.updateSettings) {
        try {
          const result = await window.electronAPI.updateSettings(cleanSettings);
          
          if (result && result.success) {
            console.log('Настройки успешно сохранены через API');
            return true;
          } else {
            console.error('API вернул ошибку при сохранении настроек:', result?.error);
            // Продолжаем выполнение, так как локально настройки уже обновлены
          }
        } catch (apiError) {
          console.error('Ошибка сохранения настроек через API:', apiError);
          // Продолжаем выполнение, так как локально настройки уже обновлены
        }
      }
      
      // Сохраняем в localStorage как fallback
      try {
        localStorage.setItem('claude-desktop-settings', JSON.stringify(cleanSettings));
        console.log('Настройки сохранены в localStorage');
      } catch (localStorageError) {
        console.error('Ошибка сохранения в localStorage:', localStorageError);
      }
      
      return true;
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    console.log(`Обновляем настройку ${key}:`, value);
    
    // Проверяем наличие null/undefined значений
    const safeValue = value === null || value === undefined ? (defaultSettings[key] || '') : value;
    
    try {
      // Обновляем локально
      const updatedSettings = { ...settings, [key]: safeValue };
      
      // Если обновили тему, применяем её сразу
      if (key === 'theme') {
        applyTheme(safeValue);
      }
      
      // Используем общую функцию обновления настроек
      return await updateSettings({ [key]: safeValue });
    } catch (error) {
      console.error(`Ошибка обновления настройки ${key}:`, error);
      setError(`Ошибка обновления настройки ${key}: ${error.message}`);
      return false;
    }
  }, [settings, updateSettings]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('Сбрасываем настройки к дефолтным');
      return await updateSettings(defaultSettings);
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      setError('Ошибка сброса настроек: ' + (err.message || err));
      return false;
    }
  }, [updateSettings]);

  // Функция для применения темы
  const applyTheme = useCallback((theme) => {
    try {
      if (!theme || theme === 'auto') {
        // Автоматический выбор в зависимости от системных предпочтений
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        console.log('Применена автоматическая тема:', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
        console.log('Применена тема:', theme);
      }
    } catch (themeError) {
      console.error('Ошибка применения темы:', themeError);
    }
  }, []);

  // Загружаем настройки при монтировании
  useEffect(() => {
    let mounted = true;
    
    const loadWithDelay = async () => {
      if (mounted) {
        await loadSettings();
      }
    };

    loadWithDelay();

    // Добавляем слушатель для изменений системной темы
    const handleSystemThemeChange = () => {
      if (settings.theme === 'auto' && mounted) {
        applyTheme('auto');
      }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    try {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else {
        // Для старых браузеров
        mediaQuery.addListener(handleSystemThemeChange);
      }
    } catch (listenerError) {
      console.error('Ошибка установки слушателя темы:', listenerError);
    }

    return () => {
      mounted = false;
      try {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        } else {
          // Для старых браузеров
          mediaQuery.removeListener(handleSystemThemeChange);
        }
      } catch (listenerError) {
        console.error('Ошибка удаления слушателя темы:', listenerError);
      }
    };
  }, [loadSettings, settings.theme, applyTheme]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    setError: clearError,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};