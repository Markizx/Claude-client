// formatters.js
// Форматирование размера файла
export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Форматирование даты
export const formatDate = (dateString) => {
  try {
    if (!dateString || dateString === 'Invalid Date') {
      return '';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Ошибка форматирования даты:', error);
    return '';
  }
};

// Форматирование времени
export const formatTime = (dateString) => {
  try {
    if (!dateString || dateString === 'Invalid Date') {
      return '';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Ошибка форматирования времени:', error);
    return '';
  }
};

// Сокращение длинного текста
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
};

// Форматирование даты и времени с защитой от "Invalid Date"
export const formatDateTime = (dateString) => {
  try {
    if (!dateString || dateString === 'Invalid Date') {
      return '';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (inputDate.getTime() === today.getTime()) {
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Ошибка форматирования даты и времени:', error);
    return '';
  }
};

export default {
  formatFileSize,
  formatDate,
  formatTime,
  truncateText,
  formatDateTime,
};