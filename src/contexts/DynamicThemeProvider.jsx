import React, { createContext, useContext, useMemo } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useSettings } from './SettingsContext';

const DynamicThemeContext = createContext();

export const useDynamicTheme = () => {
  const context = useContext(DynamicThemeContext);
  if (!context) {
    throw new Error('useDynamicTheme must be used within a DynamicThemeProvider');
  }
  return context;
};

export const DynamicThemeProvider = ({ children }) => {
  const { settings } = useSettings();

  // Определяем тему на основе настроек
  const currentTheme = useMemo(() => {
    let themeMode = 'dark'; // по умолчанию

    if (settings?.theme) {
      if (settings.theme === 'auto') {
        // Определяем тему системы
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        themeMode = prefersDark ? 'dark' : 'light';
      } else {
        themeMode = settings.theme;
      }
    }

    console.log('Создаем тему:', themeMode, 'на основе настроек:', settings?.theme);

    return themeMode;
  }, [settings?.theme]);

  // Создаем динамическую тему Material-UI
  const theme = useMemo(() => {
    const isDark = currentTheme === 'dark';
    
    console.log('Генерируем Material-UI тему:', { isDark, currentTheme });

    return createTheme({
      palette: {
        mode: currentTheme,
        primary: {
          main: isDark ? '#9d86e9' : '#6e56cf',
          light: isDark ? '#b8a9f0' : '#9d86e9',
          dark: isDark ? '#7c5ce0' : '#4c3c9b',
        },
        secondary: {
          main: '#ff4081',
          light: '#ff79b0',
          dark: '#c60055',
        },
        background: {
          default: isDark ? '#121212' : '#f5f5f7',
          paper: isDark ? '#1e1e1e' : '#ffffff',
        },
        text: {
          primary: isDark ? '#ffffff' : '#000000',
          secondary: isDark ? '#b3b3b3' : '#666666',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        action: {
          hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          selected: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: settings?.fontSize || 14,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 8,
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 12,
              backgroundImage: 'none', // убираем градиент по умолчанию
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: 'none',
              backgroundColor: isDark ? '#1e1e1e' : '#f5f5f7',
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isDark ? '#121212' : '#f5f5f7',
              color: isDark ? '#ffffff' : '#000000',
            },
          },
        },
      },
    });
  }, [currentTheme, settings?.fontSize]);

  // Применяем CSS переменные и атрибуты
  React.useEffect(() => {
    console.log('Применяем CSS атрибуты для темы:', currentTheme);
    
    // Устанавливаем атрибут темы
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // Устанавливаем CSS переменные
    const root = document.documentElement;
    
    if (currentTheme === 'dark') {
      root.style.setProperty('--background-primary', '#121212');
      root.style.setProperty('--background-secondary', '#1e1e1e');
      root.style.setProperty('--background-tertiary', '#2d2d2d');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b3b3b3');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.12)');
    } else {
      root.style.setProperty('--background-primary', '#ffffff');
      root.style.setProperty('--background-secondary', '#f5f5f7');
      root.style.setProperty('--background-tertiary', '#f0f0f0');
      root.style.setProperty('--text-primary', '#000000');
      root.style.setProperty('--text-secondary', '#666666');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.12)');
    }

    // Устанавливаем размер шрифта
    if (settings?.fontSize) {
      root.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    }

    // Компактный режим
    if (settings?.compactMode !== undefined) {
      root.setAttribute('data-compact-mode', settings.compactMode.toString());
    }
  }, [currentTheme, settings?.fontSize, settings?.compactMode]);

  // Слушаем изменения системной темы для автоматического режима
  React.useEffect(() => {
    if (settings?.theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
        console.log('Изменилась системная тема');
        // Компонент автоматически перерендерится из-за изменения useMemo
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
      } else {
        mediaQuery.addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, [settings?.theme]);

  const value = {
    theme,
    currentTheme,
    isDark: currentTheme === 'dark',
  };

  return (
    <DynamicThemeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </DynamicThemeContext.Provider>
  );
};