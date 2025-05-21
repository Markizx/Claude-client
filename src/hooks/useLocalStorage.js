import { useState, useEffect } from 'react';

const useLocalStorage = (key, initialValue) => {
  // Функция для получения начального значения из localStorage
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Ошибка чтения localStorage ключа "${key}":`, error);
      return initialValue;
    }
  };

  // Состояние для хранения значения
  const [storedValue, setStoredValue] = useState(readValue);

  // Функция для установки нового значения в localStorage и состояние
  const setValue = (value) => {
    if (typeof window === 'undefined') {
      console.warn(`Попытка установки localStorage ключа "${key}" в серверном рендеринге.`);
    }

    try {
      // Позволяет сохранять значение как функцию
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Сохраняем в состояние
      setStoredValue(valueToStore);
      
      // Сохраняем в localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Ошибка установки localStorage ключа "${key}":`, error);
    }
  };

  // Слушаем изменения ключа в localStorage
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };

    // Добавляем слушатель события storage
    window.addEventListener('storage', handleStorageChange);

    // Удаляем слушатель при размонтировании
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
};

export default useLocalStorage;