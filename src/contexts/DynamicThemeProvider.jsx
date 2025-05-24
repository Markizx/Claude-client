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
          main: isDark ? '#00d9ff' : '#6366f1',
          light: isDark ? '#33e0ff' : '#818cf8',
          dark: isDark ? '#0099cc' : '#4f46e5',
        },
        secondary: {
          main: isDark ? '#ee00ff' : '#ec4899',
          light: isDark ? '#ff66ff' : '#f472b6',
          dark: isDark ? '#cc00cc' : '#db2777',
        },
        background: {
          default: isDark ? '#0f0f23' : '#fafbff',
          paper: isDark ? '#161625' : '#ffffff',
        },
        text: {
          primary: isDark ? '#ffffff' : '#1a202c',
          secondary: isDark ? '#9ca3af' : '#4b5563',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.1)',
        action: {
          hover: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
          selected: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
        },
        grey: {
          50: isDark ? '#1e1e2e' : '#f9fafb',
          100: isDark ? '#2a2a3e' : '#f3f4f6',
          200: isDark ? '#3b3b4f' : '#e5e7eb',
          300: isDark ? '#4b4b5f' : '#d1d5db',
          400: isDark ? '#6b7280' : '#9ca3af',
          500: isDark ? '#9ca3af' : '#6b7280',
          600: isDark ? '#b3b3b3' : '#4b5563',
          700: isDark ? '#c3c3c3' : '#374151',
          800: isDark ? '#d3d3d3' : '#1f2937',
          900: isDark ? '#e3e3e3' : '#111827',
        },
      },
      typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: settings?.fontSize || 14,
      },
      shape: {
        borderRadius: 15,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              borderRadius: 25,
              padding: '10px 24px',
              fontWeight: 500,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            contained: {
              background: isDark 
                ? 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
              },
            },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: {
              borderRadius: 15,
              backgroundImage: 'none',
              backgroundColor: isDark ? 'rgba(22, 22, 37, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(10px)',
              border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)',
              boxShadow: isDark 
                ? '0 8px 32px rgba(0, 0, 0, 0.5)' 
                : '0 4px 20px rgba(99, 102, 241, 0.1)',
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              borderRight: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)',
              backgroundColor: isDark ? '#161625' : '#f3f4ff',
              backgroundImage: isDark
                ? 'radial-gradient(circle at top left, rgba(0, 217, 255, 0.05) 0%, transparent 50%)'
                : 'radial-gradient(circle at top left, rgba(99, 102, 241, 0.05) 0%, transparent 50%)',
            },
          },
        },
        MuiTextField: {
          styleOverrides: {
            root: {
              '& .MuiOutlinedInput-root': {
                borderRadius: 15,
                backgroundColor: isDark ? 'rgba(30, 30, 46, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': {
                  borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                },
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(30, 30, 46, 0.7)' : 'rgba(255, 255, 255, 0.9)',
                  '& fieldset': {
                    borderColor: isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.3)',
                  },
                },
                '&.Mui-focused': {
                  backgroundColor: isDark ? 'rgba(30, 30, 46, 0.8)' : '#ffffff',
                  '& fieldset': {
                    borderColor: isDark ? '#00d9ff' : '#6366f1',
                    borderWidth: 2,
                    boxShadow: isDark 
                      ? '0 0 0 3px rgba(0, 217, 255, 0.2)' 
                      : '0 0 0 3px rgba(99, 102, 241, 0.2)',
                  },
                },
              },
            },
          },
        },
        MuiChip: {
          styleOverrides: {
            root: {
              borderRadius: 25,
              backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.2)',
              color: isDark ? '#ffffff' : '#1a202c',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                transform: 'scale(1.05)',
              },
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                transform: 'scale(1.1)',
              },
            },
          },
        },
        MuiListItemButton: {
          styleOverrides: {
            root: {
              borderRadius: 15,
              margin: '4px 8px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
              },
              '&.Mui-selected': {
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
                borderLeft: `3px solid ${isDark ? '#00d9ff' : '#6366f1'}`,
                '&:hover': {
                  backgroundColor: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
                },
              },
            },
          },
        },
        MuiAlert: {
          styleOverrides: {
            root: {
              borderRadius: 15,
              backgroundColor: isDark ? 'rgba(30, 30, 46, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              border: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid rgba(99, 102, 241, 0.1)',
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: {
              borderRadius: 20,
              backgroundColor: isDark ? 'rgba(22, 22, 37, 0.95)' : 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(99, 102, 241, 0.1)',
              boxShadow: isDark 
                ? '0 25px 50px rgba(0, 0, 0, 0.7)' 
                : '0 25px 50px rgba(99, 102, 241, 0.15)',
            },
          },
        },
        MuiCssBaseline: {
          styleOverrides: {
            body: {
              backgroundColor: isDark ? '#0f0f23' : '#fafbff',
              color: isDark ? '#ffffff' : '#1a202c',
              scrollbarColor: isDark ? '#2a2a3e #161625' : '#e5e7eb #f3f4f6',
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
      // Темная тема с неоновыми эффектами
      root.style.setProperty('--background-primary', '#0f0f23');
      root.style.setProperty('--background-secondary', '#161625');
      root.style.setProperty('--background-tertiary', '#1e1e2e');
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#9ca3af');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
    } else {
      // Светлая тема с градиентами
      root.style.setProperty('--background-primary', '#fafbff');
      root.style.setProperty('--background-secondary', '#f3f4ff');
      root.style.setProperty('--background-tertiary', '#e8ebff');
      root.style.setProperty('--text-primary', '#1a202c');
      root.style.setProperty('--text-secondary', '#4b5563');
      root.style.setProperty('--border-color', 'rgba(99, 102, 241, 0.1)');
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