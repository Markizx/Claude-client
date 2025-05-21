// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Безопасное предоставление IPC API в рендерер-процесс
contextBridge.exposeInMainWorld('electronAPI', {
  // API Key operations
  getApiKey: () => ipcRenderer.invoke('auth:getApiKey'),
  setApiKey: (apiKey) => ipcRenderer.invoke('auth:setApiKey', apiKey),
  checkApiKey: (apiKey) => ipcRenderer.invoke('auth:checkApiKey', apiKey),
  
  // Chat operations
  getChats: () => ipcRenderer.invoke('chats:getAll'),
  createChat: (chat) => ipcRenderer.invoke('chats:create', chat),
  updateChat: (chat) => ipcRenderer.invoke('chats:update', chat),
  deleteChat: (chatId) => ipcRenderer.invoke('chats:delete', chatId),
  searchMessages: (query) => ipcRenderer.invoke('chats:searchMessages', query),
  
  // Message operations
  getMessages: (chatId) => ipcRenderer.invoke('messages:getByChatId', chatId),
  createMessage: (message) => ipcRenderer.invoke('messages:create', message),
  updateMessage: (message) => ipcRenderer.invoke('messages:update', message),
  deleteMessage: (messageId) => ipcRenderer.invoke('messages:delete', messageId),
  
  // Project operations
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  createProject: (project) => ipcRenderer.invoke('projects:create', project),
  updateProject: (project) => ipcRenderer.invoke('projects:update', project),
  deleteProject: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
  
  // Project file operations
  getProjectFiles: (projectId) => ipcRenderer.invoke('projectFiles:getByProjectId', projectId),
  createProjectFile: (file) => ipcRenderer.invoke('projectFiles:create', file),
  updateProjectFile: (file) => ipcRenderer.invoke('projectFiles:update', file),
  deleteProjectFile: (fileId) => ipcRenderer.invoke('projectFiles:delete', fileId),
  
  // File operations
  uploadFile: (file) => {
    // Для объекта File из браузера
    if (file instanceof Blob) {
      // Создаем Promise для обработки файла
      return new Promise((resolve, reject) => {
        try {
          // Создаем FileReader для чтения файла как ArrayBuffer
          const reader = new FileReader();
          
          reader.onload = async () => {
            try {
              // Получаем ArrayBuffer из результата чтения
              const arrayBuffer = reader.result;
              
              // Преобразуем в массив байтов для передачи через IPC
              const byteArray = new Uint8Array(arrayBuffer);
              
              // Отправляем данные в main process
              const result = await ipcRenderer.invoke('files:upload', {
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                data: Array.from(byteArray)
              });
              
              resolve(result);
            } catch (error) {
              console.error('Error uploading file:', error);
              reject(error);
            }
          };
          
          reader.onerror = (error) => {
            console.error('Error reading file:', error);
            reject(new Error('Failed to read file'));
          };
          
          // Читаем файл как ArrayBuffer
          reader.readAsArrayBuffer(file);
        } catch (error) {
          console.error('Error preparing file upload:', error);
          reject(error);
        }
      });
    } else if (file && file.path) {
      // Если уже есть путь к файлу (например, из диалога выбора файла)
      return ipcRenderer.invoke('files:upload', file);
    } else {
      // Прочие случаи
      return ipcRenderer.invoke('files:upload', file);
    }
  },
  
  downloadFile: (filePath) => ipcRenderer.invoke('files:download', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('files:saveFile', filePath, content),
  deleteFile: (filePath) => ipcRenderer.invoke('files:delete', filePath),
  openFileDialog: (options) => ipcRenderer.invoke('files:openDialog', options),
  saveFileDialog: (defaultPath, filters) => ipcRenderer.invoke('files:saveDialog', defaultPath, filters),
  createTempFile: (name, data) => ipcRenderer.invoke('files:createTempFile', { name, data }),
  
  // Claude AI operations
  sendToClaudeAI: (content, attachments, history) => 
    ipcRenderer.invoke('api:sendToClaudeAI', { content, attachments, history }),
  
  // Settings operations
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  updateSettings: (settings) => ipcRenderer.invoke('settings:update', settings),
  updateSetting: (key, value) => ipcRenderer.invoke('settings:updateSingle', { key, value }),
  
  // Database operations
  backupDatabase: (path) => ipcRenderer.invoke('db:backup', path),
  restoreDatabase: (path) => ipcRenderer.invoke('db:restore', path),
  
  // Export operations
  exportChat: (chatId, format, options) => 
    ipcRenderer.invoke('export:chat', chatId, format, options),
  
  // Artifact operations
  downloadArtifact: (artifactId) => ipcRenderer.invoke('artifacts:download', artifactId),
  saveArtifact: (artifact) => ipcRenderer.invoke('artifacts:save', artifact),
  
  // App utilities
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  openExternalLink: (url) => ipcRenderer.invoke('app:openExternal', url),
  showNotification: (title, body) => ipcRenderer.invoke('app:showNotification', { title, body }),
  restartApp: () => ipcRenderer.invoke('app:restart'),
  
  // Event listeners
  onChatUpdated: (callback) => {
    const subscription = (_event, chat) => callback(chat);
    ipcRenderer.on('chat:updated', subscription);
    return () => ipcRenderer.removeListener('chat:updated', subscription);
  },
  
  onChatDeleted: (callback) => {
    const subscription = (_event, chatId) => callback(chatId);
    ipcRenderer.on('chat:deleted', subscription);
    return () => ipcRenderer.removeListener('chat:deleted', subscription);
  },
  
  onMessageCreated: (callback) => {
    const subscription = (_event, message) => callback(message);
    ipcRenderer.on('message:created', subscription);
    return () => ipcRenderer.removeListener('message:created', subscription);
  },
  
  onMessageUpdated: (callback) => {
    const subscription = (_event, message) => callback(message);
    ipcRenderer.on('message:updated', subscription);
    return () => ipcRenderer.removeListener('message:updated', subscription);
  },
  
  onMessageDeleted: (callback) => {
    const subscription = (_event, messageId) => callback(messageId);
    ipcRenderer.on('message:deleted', subscription);
    return () => ipcRenderer.removeListener('message:deleted', subscription);
  },
  
  onFileUploaded: (callback) => {
    const subscription = (_event, file) => callback(file);
    ipcRenderer.on('file:uploaded', subscription);
    return () => ipcRenderer.removeListener('file:uploaded', subscription);
  },
  
  onFileUploadProgress: (callback) => {
    const subscription = (_event, progress) => callback(progress);
    ipcRenderer.on('file:uploadProgress', subscription);
    return () => ipcRenderer.removeListener('file:uploadProgress', subscription);
  }
});

// Предоставление базовой информации об ОС
contextBridge.exposeInMainWorld('systemInfo', {
  platform: process.platform,
  arch: process.arch,
  version: process.version
});

// Debugging info
console.log('Preload script executed successfully');