import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  language: 'ru',
  theme: 'dark',
  autoSave: true,
  confirmDelete: true,
  model: 'claude-3-7-sonnet-20250219',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1.0,
  messageAnimation: true,
  compactMode: false,
  showTimestamps: true,
  fontSize: 14,
  soundEnabled: true,
  desktopNotifications: true,
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
  
  // Рефы для предотвращения множественных вызовов
  const isLoadingRef = useRef(false);
  const lastSyncTimeRef = useRef(0);

  // Дебаунс для применения настроек интерфейса
  const applyTimeoutRef = useRef(null);

  // Мемоизированная функция применения темы
  const applyTheme = useCallback((theme) => {
    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
    }
    
    applyTimeoutRef.current = setTimeout(() => {
      if (!theme || theme === 'auto') {
        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    }, 50);
  }, []);

  // Мемоизированная функция применения настроек интерфейса
  const applyInterfaceSettings = useCallback((currentSettings) => {
    if (!currentSettings) return;

    if (applyTimeoutRef.current) {
      clearTimeout(applyTimeoutRef.current);
    }
    
    applyTimeoutRef.current = setTimeout(() => {
      if (currentSettings.theme) {
        applyTheme(currentSettings.theme);
      }

      if (currentSettings.fontSize) {
        document.documentElement.style.setProperty('--app-font-size', `${currentSettings.fontSize}px`);
      }

      if (currentSettings.compactMode !== undefined) {
        document.documentElement.setAttribute('data-compact-mode', currentSettings.compactMode.toString());
      }
    }, 50);
  }, [applyTheme]);

  // Оптимизированная синхронизация с API handler
  const syncWithAPIHandler = useCallback(async (settingsToSync) => {
    const now = Date.now();
    if (now - lastSyncTimeRef.current < 1000) return true; // Дебаунс 1 сек
    
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.updateSettings?.(settingsToSync);
        if (result?.success) {
          lastSyncTimeRef.current = now;
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('SettingsContext: ошибка синхронизации с API handler:', error);
      return false;
    }
  }, []);

  // Оптимизированное ожидание electronAPI
  const waitForElectronAPI = useCallback(async () => {
    if (window.electronAPI) {
      setApiReady(true);
      return true;
    }
    
    let attempts = 0;
    const maxAttempts = 30; // Уменьшили время ожидания
    
    while (!window.electronAPI && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    
    const hasAPI = !!window.electronAPI;
    setApiReady(hasAPI);
    return hasAPI;
  }, []);

  // Оптимизированная загрузка настроек
  const loadSettings = useCallback(async () => {
    if (isLoadingRef.current) return;
    isLoadingRef.current = true;
    
    try {
      setLoading(true);
      setError(null);
      
      const hasAPI = await waitForElectronAPI();
      
      if (!hasAPI) {
        setSettings(defaultSettings);
        applyInterfaceSettings(defaultSettings);
        return;
      }
      
      const savedSettings = await window.electronAPI.getSettings();
      
      if (savedSettings && typeof savedSettings === 'object' && Object.keys(savedSettings).length > 0) {
        const mergedSettings = { ...defaultSettings, ...savedSettings };
        setSettings(mergedSettings);
        applyInterfaceSettings(mergedSettings);
        
        // Синхронизируем с API handler без блокировки UI
        syncWithAPIHandler(mergedSettings);
      } else {
        setSettings(defaultSettings);
        applyInterfaceSettings(defaultSettings);
        
        // Сохраняем дефолтные настройки асинхронно
        window.electronAPI.updateSettings?.(defaultSettings).then(() => {
          syncWithAPIHandler(defaultSettings);
        });
      }
    } catch (err) {
      console.error('Ошибка загрузки настроек:', err);
      setError(err.message);
      setSettings(defaultSettings);
      applyInterfaceSettings(defaultSettings);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [waitForElectronAPI, applyInterfaceSettings, syncWithAPIHandler]);

  // Оптимизированное сохранение настроек с дебаунсом
  const updateSettings = useCallback(async (newSettings) => {
    if (saveInProgress) return false;

    try {
      setSaveInProgress(true);
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      const mergedSettings = { ...settings, ...newSettings };
      
      // Немедленно обновляем UI
      setSettings(mergedSettings);
      applyInterfaceSettings(mergedSettings);
      
      // Сохраняем в БД
      const result = await window.electronAPI.updateSettings(mergedSettings);
      
      if (result?.success) {
        // Синхронизируем с API handler асинхронно
        syncWithAPIHandler(mergedSettings);
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

  // Оптимизированное обновление одной настройки
  const updateSetting = useCallback(async (key, value) => {
    try {
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      // Немедленно обновляем локальное состояние
      setSettings(prev => {
        const updated = { ...prev, [key]: value };
        
        // Применяем настройки интерфейса если нужно
        if (['theme', 'fontSize', 'compactMode'].includes(key)) {
          applyInterfaceSettings(updated);
        }
        
        return updated;
      });
      
      // Асинхронно сохраняем в БД
      const result = await window.electronAPI.updateSetting?.(key, value);
      
      if (result?.success) {
        // Получаем обновленные настройки и синхронизируем
        const allSettings = await window.electronAPI.getSettings?.() || settings;
        syncWithAPIHandler(allSettings);
        return true;
      } else {
        throw new Error(result?.error || `Ошибка обновления настройки ${key}`);
      }
    } catch (err) {
      console.error(`Ошибка обновления настройки ${key}:`, err);
      setError(err.message);
      return false;
    }
  }, [apiReady, applyInterfaceSettings, syncWithAPIHandler, settings]);

  // Оптимизированный сброс настроек
  const resetSettings = useCallback(async () => {
    try {
      setError(null);
      
      if (!apiReady) {
        throw new Error('API не готов');
      }
      
      // Немедленно обновляем UI
      setSettings(defaultSettings);
      applyInterfaceSettings(defaultSettings);
      
      const result = await window.electronAPI.resetSettings?.();
      
      if (result?.success) {
        // Синхронизируем с API handler
        syncWithAPIHandler(defaultSettings);
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

  // Загружаем настройки только при монтировании
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Оптимизированный слушатель системной темы
  useEffect(() => {
    if (settings.theme !== 'auto') return;
    
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;
    
    const handleChange = () => applyTheme('auto');
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [settings.theme, applyTheme]);

  // Очистка таймаутов при размонтировании
  useEffect(() => {
    return () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    };
  }, []);

  // Мемоизированное значение контекста
  const value = useMemo(() => ({
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    apiReady,
    saveInProgress,
    setError: useCallback((error) => setError(error), []),
  }), [
    settings,
    updateSettings,
    updateSetting,
    resetSettings,
    loading,
    error,
    apiReady,
    saveInProgress
  ]);

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};