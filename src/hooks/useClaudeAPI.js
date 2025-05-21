import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const useClaudeAPI = () => {
  const { apiKey } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Отправка сообщения Claude
  const sendMessage = async (content, files = [], projectFiles = []) => {
    try {
      setLoading(true);
      setError(null);

      if (!apiKey) {
        throw new Error('API ключ не установлен');
      }

      // Подготовка вложений для отправки
      const attachments = files.map(file => ({
        name: file.name,
        path: file.path,
        type: file.type,
        size: file.size,
      }));

      // Получаем историю сообщений из контекста чата, если доступна
      const history = []; // В реальном сценарии это должно быть получено из контекста

      // Отправляем запрос через IPC
      const response = await window.electronAPI.sendToClaudeAI(content, attachments, history);

      if (!response || response.error) {
        throw new Error(response?.error || 'Ошибка при отправке сообщения');
      }

      return {
        content: response.content,
        id: response.id,
        model: response.model,
      };
    } catch (err) {
      setError(err.message || 'Ошибка при отправке сообщения');
      console.error('Ошибка при отправке сообщения:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
  };
};

export default useClaudeAPI;