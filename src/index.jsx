import React from 'react';
import ReactDOM from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DynamicThemeProvider } from './contexts/DynamicThemeProvider';
import { NotificationProvider } from './contexts/NotificationProvider';
import './styles/global.css';

// Используем HashRouter для Electron чтобы избежать проблем с путями
const router = createHashRouter([
  {
    path: "/*",
    element: <App />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <DynamicThemeProvider>
          <NotificationProvider>
            <CssBaseline />
            <RouterProvider router={router} />
          </NotificationProvider>
        </DynamicThemeProvider>
      </SettingsProvider>
    </AuthProvider>
  </React.StrictMode>
);