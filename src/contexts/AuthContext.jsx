import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [apiKey, setApiKeyState] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const loadApiKey = async () => {
      try {
        // Ждем, пока electronAPI станет доступным
        let attempts = 0;
        const maxAttempts = 50; // 5 секунд ожидания
        
        while (!window.electronAPI && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!window.electronAPI) {
          console.warn('electronAPI не стал доступным после ожидания');
          setHasApiKey(false);
          setCheckingAuth(false);
          return;
        }

        console.log('Проверяем сохраненный API ключ...');
        const storedKey = await window.electronAPI.getApiKey();
        
        if (storedKey && storedKey.trim()) {
          console.log('Найден сохраненный API ключ, проверяем валидность...');
          setApiKeyState(storedKey);
          
          try {
            const isValid = await window.electronAPI.checkApiKey(storedKey);
            console.log('Результат проверки API ключа:', isValid);
            setHasApiKey(isValid);
            
            if (!isValid) {
              console.log('Сохраненный API ключ неверен');
            }
          } catch (checkError) {
            console.error('Ошибка проверки API ключа:', checkError);
            setHasApiKey(false);
          }
        } else {
          console.log('Сохраненный API ключ не найден');
          setHasApiKey(false);
        }
      } catch (error) {
        console.error('Ошибка при проверке API ключа:', error);
        setHasApiKey(false);
      } finally {
        setCheckingAuth(false);
      }
    };

    loadApiKey();
  }, []);

  const setApiKey = async (key) => {
    try {
      if (!window.electronAPI) {
        console.error('electronAPI не доступен');
        return false;
      }

      console.log('Устанавливаем новый API ключ...');
      
      // Сначала пытаемся проверить ключ
      console.log('Проверяем валидность API ключа...');
      const isValid = await window.electronAPI.checkApiKey(key);
      console.log('Результат проверки нового API ключа:', isValid);
      
      if (isValid) {
        // Затем сохраняем его
        const saved = await window.electronAPI.setApiKey(key);
        if (!saved.success) {
          console.error('Не удалось сохранить API ключ');
          return false;
        }
        
        setApiKeyState(key);
        setHasApiKey(true);
        return true;
      } else {
        console.log('Новый API ключ неверен');
        setApiKeyState('');
        setHasApiKey(false);
        return false;
      }
    } catch (error) {
      console.error('Ошибка при установке API ключа:', error);
      return false;
    }
  };

  const clearApiKey = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.setApiKey('');
      }
      setApiKeyState('');
      setHasApiKey(false);
    } catch (error) {
      console.error('Ошибка при очистке API ключа:', error);
    }
  };

  const value = {
    apiKey,
    hasApiKey,
    setApiKey,
    clearApiKey,
    checkingAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};