import React, { createContext, useContext, useState, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, severity = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      severity,
      duration,
      open: true,
    };

    setNotifications(prev => [...prev, notification]);

    // Автоматически убираем уведомление через заданное время
    setTimeout(() => {
      hideNotification(id);
    }, duration);

    return id;
  };

  const hideNotification = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, open: false }
          : notification
      )
    );

    // Полностью удаляем уведомление через 300ms (время анимации закрытия)
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  };

  // Слушаем кастомные события для показа уведомлений
  useEffect(() => {
    const handleShowNotification = (event) => {
      const { message, type = 'info', duration = 3000 } = event.detail;
      showNotification(message, type, duration);
    };

    window.addEventListener('show-notification', handleShowNotification);

    return () => {
      window.removeEventListener('show-notification', handleShowNotification);
    };
  }, []);

  const value = {
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Рендерим все активные уведомления */}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={notification.open}
          autoHideDuration={null} // Управляем временем сами
          onClose={() => hideNotification(notification.id)}
          anchorOrigin={{ 
            vertical: 'bottom', 
            horizontal: 'right' 
          }}
          sx={{
            // Смещаем уведомления вверх для каждого следующего
            transform: `translateY(-${index * 70}px)`,
          }}
        >
          <Alert 
            onClose={() => hideNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ 
              width: '100%',
              minWidth: 300,
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};