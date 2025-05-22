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
  const { settings, loading: settingsLoading, apiReady } = useSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Следим за готовностью приложения
  useEffect(() => {
    if (!checkingAuth && !settingsLoading && apiReady) {
      setIsLoading(false);
    }
  }, [checkingAuth, settingsLoading, apiReady]);

  // Навигация по умолчанию
  useEffect(() => {
    if (!isLoading && hasApiKey && !initError) {
      if (location.pathname === '/' || location.pathname === '/home') {
        navigate('/chat/new', { replace: true });
      }
    }
  }, [isLoading, hasApiKey, location.pathname, navigate, initError]);

  // Показываем экран ошибки инициализации
  if (initError) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          width: '100vw',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 2, maxWidth: 500 }}>
          <Typography variant="h6" gutterBottom>
            Ошибка инициализации приложения
          </Typography>
          <Typography variant="body2">
            {initError}
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
          Попробуйте перезапустить приложение или обратитесь в службу поддержки
        </Typography>
      </Box>
    );
  }

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
        {checkingAuth && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Проверка аутентификации...
          </Typography>
        )}
        {!apiReady && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Инициализация API...
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