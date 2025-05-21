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
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const savedSettings = await window.electronAPI.getSettings();
        console.log('Загружены настройки:', savedSettings);
        
        if (savedSettings && typeof savedSettings === 'object') {
          // Мерджим с дефолтными настройками
          const mergedSettings = {
            ...defaultSettings,
            ...savedSettings
          };
          
          // Принудительно устанавливаем модель по умолчанию
          mergedSettings.model = 'claude-3-7-sonnet-20250219';
          
          setSettings(mergedSettings);
          
          // Применяем тему
          applyTheme(mergedSettings.theme || defaultSettings.theme);
          
          // Если savedSettings пустой или не содержит модель, сохраняем дефолтные настройки
          if (Object.keys(savedSettings).length === 0 || !savedSettings.model) {
            await updateSettings(mergedSettings);
          }
        } else {
          // Если сохраненные настройки не найдены, сохраняем дефолтные
          console.log('Сохраненные настройки не найдены, применяем дефолтные');
          setSettings(defaultSettings);
          await updateSettings(defaultSettings);
          
          // Применяем тему из дефолтных настроек
          applyTheme(defaultSettings.theme);
        }
      } else {
        // Пробуем загрузить из localStorage для веб-версии
        const stored = localStorage.getItem('claude-desktop-settings');
        if (stored) {
          try {
            const parsedSettings = JSON.parse(stored);
            
            // Применяем настройки с дефолтными значениями для отсутствующих полей
            const mergedSettings = {
              ...defaultSettings,
              ...parsedSettings
            };
            
            // Принудительно устанавливаем модель
            mergedSettings.model = 'claude-3-7-sonnet-20250219';
            
            setSettings(mergedSettings);
            
            // Применяем тему
            applyTheme(mergedSettings.theme || defaultSettings.theme);
            
            // Сохраняем обновленные настройки
            localStorage.setItem('claude-desktop-settings', JSON.stringify(mergedSettings));
          } catch (e) {
            console.error('Error parsing settings from localStorage:', e);
            
            // В случае ошибки используем дефолтные
            setSettings(defaultSettings);
            localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
            
            // Применяем тему из дефолтных настроек
            applyTheme(defaultSettings.theme);
          }
        } else {
          // Если настройки не найдены, инициализируем дефолтными
          localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
          setSettings(defaultSettings);
          
          // Применяем тему из дефолтных настроек
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
      
      // Очищаем null/undefined значения и делаем слияние с текущими настройками
      const cleanSettings = {...settings};
      for (const [key, value] of Object.entries(newSettings)) {
        cleanSettings[key] = value === null || value === undefined ? '' : value;
      }

      // ОБЯЗАТЕЛЬНО устанавливаем правильную модель
      cleanSettings.model = 'claude-3-7-sonnet-20250219';

      console.log('Сохраняем настройки:', cleanSettings);

      if (window.electronAPI && window.electronAPI.updateSettings) {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
          const result = await window.electronAPI.updateSettings(cleanSettings);
          
          if (result && result.success) {
            // Сначала применяем тему
            if (cleanSettings.theme) {
              applyTheme(cleanSettings.theme);
            }
            
            // Обновляем состояние
            setSettings(cleanSettings);
            console.log('Настройки успешно сохранены и применены');
            
            return true;
          } else {
            console.error('Ошибка при сохранении настроек:', result?.error);
            setError(result?.error || 'Ошибка сохранения настроек');
            return false;
          }
        } catch (apiError) {
          console.error('Ошибка API при сохранении настроек:', apiError);
          setError(`Ошибка API: ${apiError.message}`);
          return false;
        }
      } else {
        // Для веб-версии
        localStorage.setItem('claude-desktop-settings', JSON.stringify(cleanSettings));
        
        // Применяем тему
        if (cleanSettings.theme) {
          applyTheme(cleanSettings.theme);
        }
        
        // Обновляем состояние
        setSettings(cleanSettings);
        console.log('Настройки сохранены в localStorage');
        
        return true;
      }
    } catch (err) {
      console.error('Критическая ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    // Проверяем наличие null/undefined значений
    const safeValue = value === null || value === undefined ? '' : value;
    
    console.log(`Обновление настройки ${key}:`, safeValue);
    
    if (window.electronAPI && window.electronAPI.updateSetting) {
      try {
        // Задержка для надежности
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await window.electronAPI.updateSetting(key, safeValue);
        
        if (result && result.success) {
          // Обновляем состояние
          setSettings(prev => {
            const updated = { ...prev, [key]: safeValue };
            
            // Если обновили тему - применяем её
            if (key === 'theme') {
              applyTheme(safeValue);
            }
            
            // Если обновили модель - всегда ставим правильную
            if (key === 'model') {
              updated.model = 'claude-3-7-sonnet-20250219';
            }
            
            return updated;
          });
          
          return true;
        }
        
        console.error(`Ошибка обновления настройки ${key}`);
        return false;
      } catch (error) {
        console.error(`Ошибка обновления настройки ${key}:`, error);
        return false;
      }
    } else {
      // Если нет API, используем общую функцию
      return await updateSettings({ [key]: safeValue });
    }
  }, [updateSettings]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('Сброс настроек к значениям по умолчанию');
      await updateSettings(defaultSettings);
      return true;
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      return false;
    }
  }, [updateSettings]);

  // Функция для применения темы
  const applyTheme = (theme) => {
    console.log('Применение темы:', theme);
    
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