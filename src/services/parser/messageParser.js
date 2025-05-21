import { extractArtifacts, removeArtifactsFromText } from './artifactParser';

// Парсинг ответа от API Claude
export const parseResponse = (response, chatId, messageId) => {
  if (!response || !response.content) {
    throw new Error('Недопустимый формат ответа API');
  }
  
  try {
    // Собираем весь текст из ответа
    let fullText = '';
    
    response.content.forEach(item => {
      if (item.type === 'text') {
        fullText += item.text;
      }
    });
    
    // Извлекаем артефакты
    const artifacts = extractArtifacts(fullText);
    
    // Удаляем артефакты из текста сообщения
    const messageText = removeArtifactsFromText(fullText, artifacts);
    
    // Создаем объект сообщения
    const message = {
      id: messageId || Date.now(),
      chat_id: chatId,
      role: 'assistant',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
      artifacts: artifacts.map(artifact => ({
        ...artifact,
        message_id: messageId || Date.now()
      })),
      usage: response.usage || null,
      model: response.model || null
    };
    
    return message;
  } catch (error) {
    console.error('Ошибка при парсинге ответа:', error);
    throw error;
  }
};

// Форматирование сообщения пользователя
export const formatUserMessage = (content, files = [], chatId, messageId) => {
  const message = {
    id: messageId || Date.now(),
    chat_id: chatId,
    role: 'user',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    files: files.map(file => ({
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path
    }))
  };
  
  return message;
};

// Подсчет токенов (примерная оценка)
export const estimateTokens = (text) => {
  // Очень приблизительная оценка: 1 токен ≈ 4 символа для английского текста
  // Для русского текста коэффициент может быть другим
  return Math.ceil(text.length / 4);
};

export default {
  parseResponse,
  formatUserMessage,
  estimateTokens,
};