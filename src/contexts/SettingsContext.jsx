// src/contexts/SettingsContext.jsx
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
      
      if (window.electronAPI && window.electronAPI.getSettings) {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 500));
        
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
          await updateSettings(mergedSettings);
        } else {
          // Если сохраненные настройки не найдены, сохраняем дефолтные
          console.log('Настройки не найдены, устанавливаем дефолтные');
          setSettings(defaultSettings);
          await updateSettings(defaultSettings);
        }
      } else {
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

      if (window.electronAPI && window.electronAPI.updateSettings) {
        // Задержка для уверенности, что electronAPI загрузился
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const result = await window.electronAPI.updateSettings(settingsToSave);
        
        if (result && result.success) {
          // Применяем новые настройки
          setSettings(settingsToSave);
          
          // Применяем тему
          if (settingsToSave.theme) {
            applyTheme(settingsToSave.theme);
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