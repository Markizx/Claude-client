// Этот файл используется в основном через IPC в electron/ipc/files.js
// Здесь приведен только пример структуры для документации

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Копирование файла в хранилище
export const copyFileToStorage = (sourcePath, targetDir, newFileName = null) => {
  try {
    // Создаем директорию, если она не существует
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    
    // Определяем имя файла
    const fileName = newFileName || path.basename(sourcePath);
    const targetPath = path.join(targetDir, fileName);
    
    // Копируем файл
    fs.copyFileSync(sourcePath, targetPath);
    
    return targetPath;
  } catch (error) {
    console.error('Ошибка при копировании файла:', error);
    throw error;
  }
};

// Удаление файла
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    throw error;
  }
};

// Сохранение артефакта в файл
export const saveArtifactToFile = (content, targetPath) => {
  try {
    fs.writeFileSync(targetPath, content);
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении артефакта:', error);
    throw error;
  }
};

// Другие функции для работы с файлами...

export default {
  copyFileToStorage,
  deleteFile,
  saveArtifactToFile,
  // Другие функции...
};