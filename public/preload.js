const { contextBridge, ipcRenderer } = require('electron');

// Оригинальный preload.js - без лишней сложности
console.log('Preload скрипт запущен');

contextBridge.exposeInMainWorld('electronAPI', {
  // API ключ и аутентификация
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  checkApiKey: () => ipcRenderer.invoke('check-api-key'),
  
  // Работа с Claude API
  sendMessage: (chatId, message, files, projectFiles) => ipcRenderer.invoke('send-message', chatId, message, files, projectFiles),
  
  // Управление чатами
  getChats: () => ipcRenderer.invoke('get-chats'),
  getChat: (chatId) => ipcRenderer.invoke('get-chat', chatId),
  createChat: (title) => ipcRenderer.invoke('create-chat', title),
  updateChat: (chatId, data) => ipcRenderer.invoke('update-chat', chatId, data),
  deleteChat: (chatId) => ipcRenderer.invoke('delete-chat', chatId),
  archiveChat: (chatId) => ipcRenderer.invoke('archive-chat', chatId),
  exportChat: (chatId, format, options) => ipcRenderer.invoke('export-chat', chatId, format, options),
  
  // Управление сообщениями
  getChatMessages: (chatId) => ipcRenderer.invoke('get-chat-messages', chatId),
  saveMessage: (messageData) => ipcRenderer.invoke('save-message', messageData),
  getMessage: (messageId) => ipcRenderer.invoke('get-message', messageId),
  updateMessage: (messageId, content) => ipcRenderer.invoke('update-message', messageId, content),
  deleteMessage: (messageId) => ipcRenderer.invoke('delete-message', messageId),
  searchMessages: (query) => ipcRenderer.invoke('search-messages', query),
  
  // Управление артефактами
  saveArtifact: (artifactData) => ipcRenderer.invoke('save-artifact', artifactData),
  getArtifact: (artifactId) => ipcRenderer.invoke('get-artifact', artifactId),
  downloadArtifact: (artifactId, saveAs) => ipcRenderer.invoke('download-artifact', artifactId, saveAs),
  
  // Управление проектами
  getProjects: () => ipcRenderer.invoke('get-projects'),
  getProject: (projectId) => ipcRenderer.invoke('get-project', projectId),
  createProject: (title, description) => ipcRenderer.invoke('create-project', title, description),
  updateProject: (projectId, data) => ipcRenderer.invoke('update-project', projectId, data),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  
  // Управление файлами проектов
  getProjectFiles: (projectId) => ipcRenderer.invoke('get-project-files', projectId),
  addProjectFile: (projectId, fileData) => ipcRenderer.invoke('add-project-file', projectId, fileData),
  removeProjectFile: (fileId) => ipcRenderer.invoke('remove-project-file', fileId),
  
  // Общая работа с файлами
  uploadFile: (filePath, projectId) => ipcRenderer.invoke('upload-file', filePath, projectId),
  downloadFile: (filePath, saveAs) => ipcRenderer.invoke('download-file', filePath, saveAs),
  removeFile: (filePath) => ipcRenderer.invoke('remove-file', filePath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  fileExists: (filePath) => ipcRenderer.invoke('file-exists', filePath),
  
  // Диалоги выбора файлов
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog: (defaultPath, filters) => ipcRenderer.invoke('save-file-dialog', defaultPath, filters),
  
  // Работа с директориями
  createDirectory: (dirPath) => ipcRenderer.invoke('create-directory', dirPath),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
  
  // Внешние ссылки
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  
  // Настройки приложения
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Статистика и аналитика
  getChatStatistics: () => ipcRenderer.invoke('get-chat-statistics'),
  getApiUsage: () => ipcRenderer.invoke('get-api-usage'),
  
  // Резервное копирование и восстановление
  backupDatabase: (backupPath) => ipcRenderer.invoke('backup-database', backupPath),
  restoreDatabase: (backupPath) => ipcRenderer.invoke('restore-database', backupPath),
  
  // Управление приложением
  restartApp: () => ipcRenderer.invoke('restart-app'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getPlatform: () => ipcRenderer.invoke('get-platform')
});

console.log('Preload script выполнен успешно - electronAPI доступен');

// Уведомление, когда DOM загружен
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM полностью загружен');
});