import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Typography } from '@mui/material';
import MainLayout from './components/Layout/MainLayout';
import ChatView from './components/Chat/ChatView';
import ProjectView from './components/Projects/ProjectView';
import ApiKeySetup from './components/Setup/ApiKeySetup';
import { useAuth } from './contexts/AuthContext';
import { useSettings } from './contexts/SettingsContext';
import { ChatProvider } from './contexts/ChatContext';
import { ProjectProvider } from './contexts/ProjectContext';

const AppContent = () => {
  const { hasApiKey, checkingAuth } = useAuth();
  const { settings, loading: settingsLoading } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Функция для применения настроек интерфейса
  const applyInterfaceSettings = useCallback((currentSettings) => {
    if (!currentSettings) return;

    // Применяем тему
    if (currentSettings.theme) {
      if (currentSettings.theme === 'auto') {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const appliedTheme = prefersDark ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', appliedTheme);
      } else {
        document.documentElement.setAttribute('data-theme', currentSettings.theme);
      }
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
  }, []);

  // Применяем настройки при их изменении
  useEffect(() => {
    if (settings && !settingsLoading) {
      applyInterfaceSettings(settings);
    }
  }, [settings, settingsLoading, applyInterfaceSettings]);

  // Следим за готовностью приложения
  useEffect(() => {
    if (!checkingAuth && !settingsLoading) {
      setIsLoading(false);
    }
  }, [checkingAuth, settingsLoading]);

  // Навигация по умолчанию
  useEffect(() => {
    if (!isLoading && hasApiKey) {
      if (location.pathname === '/' || location.pathname === '/home') {
        navigate('/chat/new', { replace: true });
      }
    }
  }, [isLoading, hasApiKey, location.pathname, navigate]);

  // Слушаем изменения системной темы для автоматической темы
  useEffect(() => {
    if (settings?.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = () => {
        applyInterfaceSettings(settings);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleSystemThemeChange);
      } else {
        mediaQuery.addListener(handleSystemThemeChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleSystemThemeChange);
        } else {
          mediaQuery.removeListener(handleSystemThemeChange);
        }
      };
    }
  }, [settings?.theme, applyInterfaceSettings, settings]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Загрузка приложения...</Typography>
        {settingsLoading && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Загрузка настроек...
          </Typography>
        )}
      </Box>
    );
  }

  // Если API ключ не установлен, показываем экран настройки
  if (!hasApiKey) {
    return <ApiKeySetup />;
  }

  return (
    <ProjectProvider>
      <ChatProvider>
        <MainLayout>
          <Routes>
            <Route path="/chat/:chatId" element={<ChatView />} />
            <Route path="/project/:projectId" element={<ProjectView />} />
            <Route path="/" element={<Navigate to="/chat/new" replace />} />
            <Route path="/home" element={<Navigate to="/chat/new" replace />} />
            <Route 
              path="*" 
              element={
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Страница не найдена: {location.pathname}
                  </Alert>
                  <Box sx={{ mt: 2 }}>
                    <button onClick={() => navigate('/chat/new')}>
                      Перейти к чату
                    </button>
                  </Box>
                </Box>
              } 
            />
          </Routes>
        </MainLayout>
      </ChatProvider>
    </ProjectProvider>
  );
};

const App = () => {
  return <AppContent />;
};

export default App;