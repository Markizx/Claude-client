import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings должен использоваться внутри SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  // Основные настройки
  language: 'ru',
  theme: 'light',
  autoSave: true,
  confirmDelete: true,
  
  // Настройки AI - ИСПРАВЛЕНО!
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
      
      // Увеличенная задержка для ожидания загрузки электронного API
      const waitForElectronAPI = async (maxAttempts = 100) => {
        let attempts = 0;
        while (!window.electronAPI && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        return !!window.electronAPI;
      };
      
      const hasElectronAPI = await waitForElectronAPI();
      
      if (hasElectronAPI) {
        // Электронное API доступно, загружаем настройки
        console.log('Загрузка настроек через electronAPI...');
        
        const savedSettings = await window.electronAPI.getSettings();
        console.log('Загруженные настройки:', savedSettings);
        
        if (savedSettings && typeof savedSettings === 'object') {
          // Мерджим с дефолтными настройками
          const mergedSettings = {
            ...defaultSettings,
            ...savedSettings
          };
          
          // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: всегда устанавливаем модель claude-3-7-sonnet
          mergedSettings.model = 'claude-3-7-sonnet-20250219';
          
          setSettings(mergedSettings);
          console.log('Установлены настройки:', mergedSettings);
          
          // Применяем тему
          applyTheme(mergedSettings.theme || defaultSettings.theme);
          
          // Сохраняем изменённые настройки (с принудительной моделью)
          // Это важно для синхронизации и обеспечения согласованности
          const updated = await updateSettings(mergedSettings);
          if (updated) {
            console.log('Настройки успешно синхронизированы');
          } else {
            console.warn('Не удалось синхронизировать настройки');
          }
        } else {
          // Если сохраненные настройки не найдены, сохраняем дефолтные
          console.log('Настройки не найдены, устанавливаем дефолтные');
          setSettings(defaultSettings);
          await updateSettings(defaultSettings);
        }
      } else {
        // Электронное API недоступно, используем localStorage
        console.log('electronAPI недоступен, использование localStorage...');
        
        // Пробуем загрузить из localStorage для веб-версии
        const stored = localStorage.getItem('claude-desktop-settings');
        if (stored) {
          try {
            const parsedSettings = JSON.parse(stored);
            
            // Мерджим с дефолтными настройками
            const mergedSettings = {
              ...defaultSettings,
              ...parsedSettings
            };
            
            // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: всегда устанавливаем модель claude-3-7-sonnet
            mergedSettings.model = 'claude-3-7-sonnet-20250219';
            
            setSettings(mergedSettings);
            
            // Применяем тему
            applyTheme(mergedSettings.theme || defaultSettings.theme);
            
            // Сохраняем обновленные настройки
            localStorage.setItem('claude-desktop-settings', JSON.stringify(mergedSettings));
          } catch (e) {
            console.error('Error parsing settings from localStorage:', e);
            setSettings(defaultSettings);
            localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
          }
        } else {
          // Если настройки не найдены, инициализируем дефолтными
          setSettings(defaultSettings);
          localStorage.setItem('claude-desktop-settings', JSON.stringify(defaultSettings));
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError('Ошибка загрузки настроек: ' + (err.message || err));
      setSettings(defaultSettings); // В случае ошибки используем дефолтные
    } finally {
      setLoading(false);
    }
  }, []);

  // Сохранение настроек
  const updateSettings = useCallback(async (newSettings) => {
    try {
      console.log('Сохранение настроек:', newSettings);
      setError(null);
      
      // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: всегда принудительно устанавливаем правильную модель
      const settingsToSave = {
        ...newSettings,
        model: 'claude-3-7-sonnet-20250219' // Принудительная установка
      };
      
      console.log('Настройки для сохранения (с принудительной моделью):', settingsToSave);

      // Увеличенная задержка ожидания electronAPI
      const waitForElectronAPI = async (maxAttempts = 50) => {
        let attempts = 0;
        while (!window.electronAPI && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        return !!window.electronAPI;
      };
      
      const hasElectronAPI = await waitForElectronAPI();

      if (hasElectronAPI && window.electronAPI.updateSettings) {
        // Пытаемся сохранить через electronAPI
        const result = await window.electronAPI.updateSettings(settingsToSave);
        
        if (result && result.success) {
          // Применяем новые настройки
          setSettings(settingsToSave);
          
          // Применяем тему
          if (settingsToSave.theme) {
            applyTheme(settingsToSave.theme);
            
            // Также сохраняем тему как атрибут на документе для CSS
            document.documentElement.setAttribute('data-theme', settingsToSave.theme);
          }
          
          console.log('Настройки успешно сохранены и применены');
          return true;
        } else if (result && result.error) {
          console.error('Ошибка сохранения настроек:', result.error);
          setError(result.error);
          return false;
        }
      } else {
        // Сохраняем в localStorage для веб-версии
        localStorage.setItem('claude-desktop-settings', JSON.stringify(settingsToSave));
        setSettings(settingsToSave);
        
        // Применяем тему
        if (settingsToSave.theme) {
          applyTheme(settingsToSave.theme);
          
          // Также сохраняем тему как атрибут на документе для CSS
          document.documentElement.setAttribute('data-theme', settingsToSave.theme);
        }
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Ошибка сохранения настроек:', err);
      setError('Ошибка сохранения настроек: ' + (err.message || err));
      return false;
    }
  }, []);

  // Обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    console.log(`Обновление настройки: ${key} = ${value}`);
    
    try {
      // КРИТИЧЕСКИЙ КОНТРОЛЬ: не даём менять модель на другую, только 3.7 Sonnet
      if (key === 'model' && value !== 'claude-3-7-sonnet-20250219') {
        console.warn('Попытка изменить модель отклонена! Фиксированная модель claude-3-7-sonnet-20250219');
        value = 'claude-3-7-sonnet-20250219';
      }
      
      const newSettings = { ...settings, [key]: value };
      return await updateSettings(newSettings);
    } catch (error) {
      console.error(`Ошибка обновления настройки ${key}:`, error);
      return false;
    }
  }, [settings, updateSettings]);

  // Сброс настроек к значениям по умолчанию
  const resetSettings = useCallback(async () => {
    try {
      console.log('Сброс настроек к значениям по умолчанию');
      const result = await updateSettings(defaultSettings);
      return result;
    } catch (err) {
      console.error('Ошибка сброса настроек:', err);
      return false;
    }
  }, [updateSettings]);

  // Функция для применения темы
  const applyTheme = (theme) => {
    console.log(`Применение темы: ${theme}`);
    
    if (!theme || theme === 'auto') {
      // Автоматический выбор в зависимости от системных предпочтений
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const themeToApply = prefersDark ? 'dark' : 'light';
      console.log(`Автоматический выбор темы: ${themeToApply}`);
      document.documentElement.setAttribute('data-theme', themeToApply);
    } else {
      console.log(`Установка темы: ${theme}`);
      document.documentElement.setAttribute('data-theme', theme);
    }
  };

  // Загружаем настройки при монтировании
  useEffect(() => {
    let mounted = true;
    
    const loadWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          if (!mounted) return;
          await loadSettings();
          break;
        } catch (err) {
          console.error(`Attempt ${i+1} failed to load settings:`, err);
          if (i === retries - 1) {
            // Last attempt failed, use defaults
            setSettings(defaultSettings);
            setLoading(false);
          } else {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    };

    loadWithRetry();

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