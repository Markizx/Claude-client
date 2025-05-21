import React, { useEffect, useState } from 'react';
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

  // Применение настроек темы
  useEffect(() => {
    if (settings && settings.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings]);

  useEffect(() => {
    // Проверяем, загрузилось ли приложение и проверен ли API ключ
    if (!checkingAuth && !settingsLoading) {
      setIsLoading(false);
    }
  }, [checkingAuth, settingsLoading]);

  // Добавляем обработчик для навигации по умолчанию
  useEffect(() => {
    if (!isLoading && hasApiKey) {
      // Если мы на главной странице, перенаправляем на новый чат
      if (location.pathname === '/' || location.pathname === '/home') {
        navigate('/chat/new', { replace: true });
      }
    }
  }, [isLoading, hasApiKey, location.pathname, navigate]);

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