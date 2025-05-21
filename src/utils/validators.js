// Проверка API ключа
export const isValidApiKey = (apiKey) => {
  // Пример формата ключа Claude: sk-ant-api03-...
  if (!apiKey) return false;
  
  const pattern = /^sk-ant-[a-zA-Z0-9-]{10,}$/;
  return pattern.test(apiKey);
};

// Проверка URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Проверка изображения
export const isImageFile = (fileName) => {
  if (!fileName) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  return imageExtensions.includes(ext);
};

// Проверка текстового файла
export const isTextFile = (fileName) => {
  if (!fileName) return false;
  
  const textExtensions = ['.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.py', '.html', '.css', '.json', '.csv', '.xml', '.yml', '.yaml'];
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  return textExtensions.includes(ext);
};

// Проверка PDF файла
export const isPdfFile = (fileName) => {
  if (!fileName) return false;
  
  return fileName.toLowerCase().endsWith('.pdf');
};

// Максимальные размеры файлов
export const MAX_FILE_SIZE = 52428800; // 50MB
export const MAX_TEXT_FILE_SIZE = 102400; // 100KB

// Валидация размера файла
export const isValidFileSize = (size, isTextFile = false) => {
  if (isTextFile) {
    return size <= MAX_TEXT_FILE_SIZE;
  }
  return size <= MAX_FILE_SIZE;
};

export default {
  isValidApiKey,
  isValidUrl,
  isImageFile,
  isTextFile,
  isPdfFile,
  isValidFileSize,
  MAX_FILE_SIZE,
  MAX_TEXT_FILE_SIZE,
};