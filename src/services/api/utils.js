// Утилиты для работы с API
export const formatApiError = (error) => {
  if (error.response) {
    // Ошибка от сервера
    const status = error.response.status;
    const message = error.response.data?.error?.message || error.response.statusText;
    
    switch (status) {
      case 400:
        return `Неверный запрос: ${message}`;
      case 401:
        return 'Неверный API ключ';
      case 402:
        return 'Недостаточно средств на счете';
      case 403:
        return 'Доступ запрещен';
      case 404:
        return 'Ресурс не найден';
      case 429:
        return 'Превышен лимит запросов';
      case 500:
        return 'Внутренняя ошибка сервера';
      default:
        return `Ошибка сервера (${status}): ${message}`;
    }
  } else if (error.request) {
    // Ошибка сети
    return 'Нет соединения с сервером';
  } else {
    // Другая ошибка
    return error.message || 'Неизвестная ошибка';
  }
};

// Валидация API ключа
export const validateApiKey = (apiKey) => {
  if (!apiKey) return false;
  
  // Примерный формат ключа Claude: sk-ant-api03-...
  const pattern = /^sk-ant-[a-zA-Z0-9-_]{20,}$/;
  return pattern.test(apiKey);
};

// Оценка количества токенов
export const estimateTokens = (text) => {
  // Приблизительная оценка: 1 токен ≈ 4 символа
  return Math.ceil(text.length / 4);
};

// Форматирование размера файла
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Проверка типа файла
export const getFileType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  
  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const textTypes = ['txt', 'md', 'js', 'py', 'html', 'css', 'json', 'xml'];
  const codeTypes = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'php'];
  
  if (imageTypes.includes(ext)) return 'image';
  if (textTypes.includes(ext)) return 'text';
  if (codeTypes.includes(ext)) return 'code';
  if (ext === 'pdf') return 'pdf';
  
  return 'unknown';
};

export default {
  formatApiError,
  validateApiKey,
  estimateTokens,
  formatBytes,
  getFileType,
};