import { useState } from 'react';
import { isImageFile, isTextFile, isPdfFile } from '../utils/validators';

const useFileProcessor = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Функция для чтения содержимого файла
  const readFileContent = async (file) => {
    try {
      setProcessing(true);
      setError(null);

      if (!file) {
        throw new Error('Файл не предоставлен');
      }

      // Проверяем тип файла
      if (isImageFile(file.name)) {
        // Для изображений возвращаем URL
        return {
          type: 'image',
          content: URL.createObjectURL(file),
          fileObject: file,
        };
      } else if (isTextFile(file.name)) {
        // Для текстовых файлов читаем содержимое
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          reader.onload = (e) => {
            resolve({
              type: 'text',
              content: e.target.result,
              fileObject: file,
            });
          };
          
          reader.onerror = (e) => {
            reject(new Error('Ошибка при чтении файла'));
          };
          
          reader.readAsText(file);
        });
      } else if (isPdfFile(file.name)) {
        // Для PDF файлов просто возвращаем информацию о файле
        // Полноценная работа с PDF требует дополнительных библиотек
        return {
          type: 'pdf',
          content: null,
          fileObject: file,
        };
      } else {
        // Для других типов файлов
        return {
          type: 'unknown',
          content: null,
          fileObject: file,
        };
      }
    } catch (err) {
      setError(err.message || 'Ошибка при обработке файла');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  // Функция для получения превью изображения
  const getImagePreview = async (file) => {
    try {
      setProcessing(true);
      setError(null);

      if (!file || !isImageFile(file.name)) {
        throw new Error('Неверный формат файла');
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        
        reader.onerror = () => {
          reject(new Error('Ошибка при создании превью'));
        };
        
        reader.readAsDataURL(file);
      });
    } catch (err) {
      setError(err.message || 'Ошибка при создании превью');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  // Функция для обработки множества файлов
  const processFiles = async (files) => {
    try {
      setProcessing(true);
      setError(null);
      
      const results = [];
      
      for (const file of files) {
        const result = await readFileContent(file);
        results.push(result);
      }
      
      return results;
    } catch (err) {
      setError(err.message || 'Ошибка при обработке файлов');
      throw err;
    } finally {
      setProcessing(false);
    }
  };

  return {
    readFileContent,
    getImagePreview,
    processFiles,
    processing,
    error,
  };
};

export default useFileProcessor;