// electron/ipc/files.js
const { ipcMain, app, dialog, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// File Handler class
class FileHandler {
  constructor() {
    this.uploadDir = path.join(app.getPath('userData'), 'storage', 'files');
    this.tempDir = path.join(app.getPath('userData'), 'storage', 'temp');
    this.ensureDirectories();
  }

  ensureDirectories() {
    try {
      const dirs = [
        this.uploadDir,
        this.tempDir,
        path.join(app.getPath('userData'), 'storage', 'artifacts'),
        path.join(app.getPath('userData'), 'storage', 'chats'),
        path.join(app.getPath('userData'), 'storage', 'projects')
      ];
      
      for (const dir of dirs) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          console.log(`Created directory: ${dir}`);
        }
      }
    } catch (error) {
      console.error('Error creating directories:', error);
    }
  }

  async uploadFile(fileData) {
    try {
      // Генерируем уникальный ID для файла
      const fileId = uuidv4();
      
      // Получаем имя файла и расширение
      const fileName = fileData.name || `file-${fileId}`;
      const fileExt = path.extname(fileName) || '.bin';
      
      // Создаем безопасное имя файла с уникальным ID
      const safeFileName = `${fileId}${fileExt}`;
      const filePath = path.join(this.uploadDir, safeFileName);
      
      // Убеждаемся, что директория существует
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }
      
      console.log(`Загрузка файла: ${fileName} (${fileData.type || 'unknown type'})`);
      
      // Записываем данные файла на диск
      if (fileData.data) {
        try {
          // Если данные переданы как base64 строка
          if (typeof fileData.data === 'string') {
            // Проверяем, не является ли это data URL
            let buffer;
            if (fileData.data.startsWith('data:')) {
              // Извлекаем base64 данные из data URL
              const base64Data = fileData.data.split(',')[1];
              buffer = Buffer.from(base64Data, 'base64');
            } else {
              buffer = Buffer.from(fileData.data, 'base64');
            }
            
            fs.writeFileSync(filePath, buffer);
            console.log(`Файл сохранен из base64: ${filePath} (${buffer.length} байт)`);
          }
          // Если данные переданы как массив байтов
          else if (Array.isArray(fileData.data)) {
            const buffer = Buffer.from(fileData.data);
            fs.writeFileSync(filePath, buffer);
            console.log(`Файл сохранен из массива байтов: ${filePath} (${buffer.length} байт)`);
          }
          // Если данные переданы как ArrayBuffer
          else if (fileData.data instanceof ArrayBuffer || 
                   (typeof fileData.data === 'object' && fileData.data !== null)) {
            let buffer;
            try {
              buffer = Buffer.from(fileData.data);
            } catch (err) {
              // Если не удалось напрямую, пробуем преобразовать
              const uint8Array = new Uint8Array(fileData.data);
              buffer = Buffer.from(uint8Array);
            }
            
            fs.writeFileSync(filePath, buffer);
            console.log(`Файл сохранен из ArrayBuffer: ${filePath} (${buffer.length} байт)`);
          } 
          else {
            throw new Error(`Неподдерживаемый формат данных: ${typeof fileData.data}`);
          }
        } catch (err) {
          console.error('Ошибка сохранения данных файла:', err);
          throw err;
        }
      } else if (fileData.path) {
        // Если передан путь, копируем файл
        fs.copyFileSync(fileData.path, filePath);
        console.log(`Файл скопирован: ${fileData.path} -> ${filePath}`);
      } else {
        throw new Error('Нет данных файла');
      }
      
      // Возвращаем метаданные файла
      return {
        success: true,
        id: fileId,
        name: fileName,
        path: filePath,
        type: fileData.type || this.getMimeType(fileName),
        size: fileData.size || fs.statSync(filePath).size
      };
    } catch (error) {
      console.error('Ошибка обработки загрузки файла:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async downloadFile(filePath) {
    try {
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      
      // Показываем диалог сохранения
      const result = await dialog.showSaveDialog({
        defaultPath: path.basename(filePath)
      });
      
      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Download canceled' };
      }
      
      // Копируем файл в выбранное место
      fs.copyFileSync(filePath, result.filePath);
      
      return { success: true, path: result.filePath };
    } catch (error) {
      console.error('Error processing file download:', error);
      return { success: false, error: error.message || String(error) };
    }
  }

  async deleteFile(filePath) {
    try {
      // Проверяем существование файла
      if (!fs.existsSync(filePath)) {
        return { success: true, message: 'File already deleted' };
      }
      
      // Удаляем файл
      fs.unlinkSync(filePath);
      console.log(`File deleted: ${filePath}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error processing file deletion:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
  
  async openFileDialog(options = {}) {
    try {
      const dialogOptions = {
        properties: ['openFile', 'multiSelections'],
        filters: options.filters || [
          { name: 'All Files', extensions: ['*'] }
        ],
        ...options
      };
      
      const result = await dialog.showOpenDialog(dialogOptions);
      
      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, message: 'No files selected' };
      }
      
      // Обрабатываем выбранные файлы
      const files = result.filePaths.map(filePath => {
        const stats = fs.statSync(filePath);
        return {
          name: path.basename(filePath),
          path: filePath,
          size: stats.size,
          type: this.getMimeType(filePath),
          lastModified: stats.mtime.getTime()
        };
      });
      
      return { success: true, files };
    } catch (error) {
      console.error('Error opening file dialog:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
  
  async saveFileDialog(defaultPath = '', filters = []) {
    try {
      const dialogOptions = {
        defaultPath: defaultPath,
        filters: filters.length > 0 ? filters : [
          { name: 'All Files', extensions: ['*'] }
        ]
      };
      
      const result = await dialog.showSaveDialog(dialogOptions);
      
      if (result.canceled || !result.filePath) {
        return { success: false, message: 'Save canceled' };
      }
      
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('Error opening save dialog:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
  
  async saveFile(filePath, content) {
    try {
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
  
  async createTempFile(name, data) {
    try {
      // Генерируем уникальный ID для временного файла
      const fileId = uuidv4();
      const fileExt = path.extname(name) || '.tmp';
      const safeFileName = `${fileId}${fileExt}`;
      
      // Создаем временную директорию, если она не существует
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      const filePath = path.join(this.tempDir, safeFileName);
      
      // Записываем файл на диск
      let buffer;
      
      // Проверяем тип данных
      if (typeof data === 'string') {
        // Если это строка, пытаемся определить, является ли она base64
        if (data.match(/^data:.+;base64,/)) {
          // Это data URL, извлекаем часть base64
          const base64Data = data.split(',')[1];
          buffer = Buffer.from(base64Data, 'base64');
        } else {
          // Обычная строка или уже base64
          try {
            // Пробуем как base64
            buffer = Buffer.from(data, 'base64');
          } catch {
            // Если не base64, то просто как текст
            buffer = Buffer.from(data);
          }
        }
      } else if (Array.isArray(data)) {
        // Массив байтов
        buffer = Buffer.from(data);
      } else if (data instanceof ArrayBuffer) {
        // ArrayBuffer
        buffer = Buffer.from(data);
      } else if (typeof data === 'object' && data !== null) {
        // Объект - преобразуем в JSON
        buffer = Buffer.from(JSON.stringify(data));
      } else {
        // Другие типы данных
        buffer = Buffer.from(String(data));
      }
      
      fs.writeFileSync(filePath, buffer);
      
      console.log(`Temp file created: ${filePath} (${buffer.length} bytes)`);
      
      return { success: true, path: filePath };
    } catch (error) {
      console.error('Error creating temp file:', error);
      return { success: false, error: error.message || String(error) };
    }
  }
  
  // Вспомогательная функция для определения MIME-типа по расширению файла
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.csv': 'text/csv',
      '.md': 'text/markdown',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.ico': 'image/x-icon'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  // Вспомогательная функция для определения, является ли файл изображением
  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }
  
  // Очистка временных файлов
  cleanupTempFiles(olderThanHours = 24) {
    try {
      if (!fs.existsSync(this.tempDir)) {
        return;
      }
      
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const msPerHour = 3600000;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        // Проверяем возраст файла
        const fileAge = (now - stats.mtime.getTime()) / msPerHour;
        
        if (fileAge > olderThanHours) {
          fs.unlinkSync(filePath);
          console.log(`Deleted old temp file: ${filePath} (${fileAge.toFixed(1)} hours old)`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  }
}

// Создаем экземпляр обработчика файлов
const fileHandler = new FileHandler();

// Запускаем периодическую очистку временных файлов (каждый час)
setInterval(() => {
  fileHandler.cleanupTempFiles();
}, 3600000);

// Функция для регистрации обработчиков IPC
function register(ipcMain) {
  // Регистрация обработчиков IPC
  ipcMain.handle('files:upload', async (event, fileData) => {
    return await fileHandler.uploadFile(fileData);
  });

  ipcMain.handle('files:download', async (event, filePath) => {
    return await fileHandler.downloadFile(filePath);
  });

  ipcMain.handle('files:delete', async (event, filePath) => {
    return await fileHandler.deleteFile(filePath);
  });
  
  ipcMain.handle('files:openDialog', async (event, options = {}) => {
    return await fileHandler.openFileDialog(options);
  });
  
  ipcMain.handle('files:saveDialog', async (event, defaultPath = '', filters = []) => {
    return await fileHandler.saveFileDialog(defaultPath, filters);
  });
  
  ipcMain.handle('files:createTempFile', async (event, { name, data }) => {
    return await fileHandler.createTempFile(name, data);
  });
  
  ipcMain.handle('files:saveFile', async (event, filePath, content) => {
    return await fileHandler.saveFile(filePath, content);
  });
}

// Экспортируем обработчик файлов
module.exports = {
  register,
  fileHandler
};