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
      const maxAttempts = 100; // 10 секунд ожидания
      
      while (!window.electronAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.electronAPI) {
        console.warn('electronAPI не доступен, используем localStorage');
        
        // Fallback - используем localStorage
        const stored = localStorage.getItem('claude-desktop-settings');
        if (stored) {
          try {
            const parsedSettings = JSON.parse(stored);
            const mergedSettings = { ...defaultSettings, ...parsedSettings };
            
            // Принудительно устанавливаем правильную модель
            mergedSettings.model = 'claude-3-7-sonnet-20250219';
            
            setSettings(mergedSettings);
            applyTheme(mergedSettings.theme);
          } catch (e) {
            console.error('Error parsing settings from localStorage:', e);
            setSettings(defaultSettings);
          }
        } else {
          setSettings(defaultSettings);
        }
        return;
      }
      
      console.log('Загружаем настройки через electronAPI...');
      const savedSettings = await window.electronAPI.getSettings();
      
      console.log('Полученные настройки:', savedSettings);
      
      if (savedSettings && typeof savedSettings === 'object') {
        // Мерджим с дефолтными настройками для обеспечения всех ключей
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        
        // Принудительно устанавливаем правильную модель
        if (!mergedSettings.model || mergedSettings.model !== 'claude-3-7-sonnet-20250219') {
          mergedSettings.model = 'claude-3-7-sonnet-20250219';
          
          // Сохраняем исправленную модель
          try {
            await window.electronAPI.updateSetting('model', 'claude-3-7-sonnet-20250219');
          } catch (updateError) {
            console.error('Ошибка обновления модели:', updateError);
          }
        }
        
        setSettings(mergedSettings);
        applyTheme(mergedSettings.theme);
        
        console.log('Настройки успешно загружены и применены:', mergedSettings);
      } else {
        console.log('Настройки не найдены, сохраняем дефолтные');
        
        // Если сохраненные настройки не найдены, сохраняем дефолтные
        await updateSettings(defaultSettings);
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
      
      console.log('Обновляем настройки:', newSettings);
      
      // Проверяем наличие null/undefined значений и заменяем их пустой строкой
      const cleanSettings = {};
      for (const [key, value] of Object.entries({...settings, ...newSettings})) {
        cleanSettings[key] = value === null || value === undefined ? '' : value;
      }

      // Всегда устанавливаем правильную модель
      cleanSettings.model = cleanSettings.model || 'claude-3-7-sonnet-20250219';

      // Ждем доступности electronAPI
      let attempts = 0;
      const maxAttempts = 50; // 5 секунд ожидания
      
      while (!window.electronAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.electronAPI) {
        console.warn('electronAPI не доступен, сохраняем в localStorage');
        
        // Fallback - сохраняем в localStorage
        localStorage.setItem('claude-desktop-settings', JSON.stringify(cleanSettings));
        setSettings(cleanSettings);
        applyTheme(cleanSettings.theme);
        return true;
      }
      
      console.log('Сохраняем настройки через electronAPI:', cleanSettings);
      const result = await window.electronAPI.updateSettings(cleanSettings);
      
      console.log('Результат сохранения:', result);
      
      if (result && result.success) {
        setSettings(cleanSettings);
        applyTheme(cleanSettings.theme);
        
        console.log('Настройки успешно сохранены и применены');
        return true;
      } else if (result && result.error) {
        setError(result.error);
        console.error('Ошибка при сохранении настроек:', result.error);
        return false;
      }
      
      console.error('Неожиданный результат при сохранении настроек:', result);
      return false;
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, [settings]);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    try {
      console.log(`Обновляем настройку ${key}:`, value);
      
      // Проверяем наличие null/undefined значений
      const safeValue = value === null || value === undefined ? '' : value;
      
      // Ждем доступности electronAPI
      let attempts = 0;
      const maxAttempts = 50;
      
      while (!window.electronAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (!window.electronAPI) {
        console.warn('electronAPI не доступен, обновляем через updateSettings');
        return await updateSettings({ [key]: safeValue });
      }
      
      const result = await window.electronAPI.updateSetting(key, safeValue);
      
      console.log(`Результат обновления настройки ${key}:`, result);
      
      if (result && result.success) {
        setSettings(prev => {
          const updated = { ...prev, [key]: safeValue };
          
          // Если обновили тему, применяем её
          if (key === 'theme') {
            applyTheme(safeValue);
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
  }, [updateSettings]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('Сбрасываем настройки к значениям по умолчанию');
      
      if (window.electronAPI) {
        const result = await window.electronAPI.resetSettings?.();
        console.log('Результат сброса настроек:', result);
      }
      
      // В любом случае обновляем состояние
      await updateSettings(defaultSettings);
      return true;
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      setError('Ошибка сброса настроек: ' + (err.message || err));
      return false;
    }
  }, [updateSettings]);

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
  }, []); // Убираем зависимости чтобы избежать лишних перезагрузок

  // Применяем тему при изменении настроек темы
  useEffect(() => {
    if (settings.theme && !loading) {
      applyTheme(settings.theme);
    }
  }, [settings.theme, loading, applyTheme]);

  const value = {
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    setError: useCallback((error) => setError(error), []),
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};