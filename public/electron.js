const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const url = require('url');
const Store = require('electron-store');
const crypto = require('crypto');

// Настройка шифрования для API ключа
const ENCRYPTION_KEY = crypto.scryptSync('claude-desktop-secret', 'salt', 32);
const IV_LENGTH = 16;

// Настройка хранилища
const store = new Store({
  name: 'claude-desktop-config'
});

// Определяем, в каком режиме работает приложение
const isDev = process.env.NODE_ENV === 'development';

// Импорт обработчиков IPC с проверкой путей
let apiHandlers, fileHandlers, storageHandlers;

try {
  if (isDev) {
    // В режиме разработки
    apiHandlers = require('./ipc/api');
    fileHandlers = require('./ipc/files');
    storageHandlers = require('./ipc/storage');
  } else {
    // В продакшене (после сборки)
    const electronPath = path.join(process.resourcesPath, 'electron');
    apiHandlers = require(path.join(electronPath, 'ipc', 'api'));
    fileHandlers = require(path.join(electronPath, 'ipc', 'files'));
    storageHandlers = require(path.join(electronPath, 'ipc', 'storage'));
  }
} catch (error) {
  console.error('Ошибка загрузки IPC модулей:', error);
  // Попробуем альтернативные пути
  try {
    apiHandlers = require(path.join(__dirname, 'ipc', 'api'));
    fileHandlers = require(path.join(__dirname, 'ipc', 'files'));
    storageHandlers = require(path.join(__dirname, 'ipc', 'storage'));
  } catch (fallbackError) {
    console.error('Критическая ошибка загрузки IPC модулей:', fallbackError);
    process.exit(1);
  }
}

// Основное окно приложения
let mainWindow;

// Создание директорий хранения при необходимости
function ensureDirectories() {
  const userDataPath = app.getPath('userData');
  const dirs = [
    path.join(userDataPath, 'storage'),
    path.join(userDataPath, 'storage/chats'),
    path.join(userDataPath, 'storage/projects'),
    path.join(userDataPath, 'storage/files'),
    path.join(userDataPath, 'storage/artifacts'),
    path.join(userDataPath, 'db')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Создана директория: ${dir}`);
    }
  });
}

// Создание главного окна
function createWindow() {
  ensureDirectories();

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev 
        ? path.join(__dirname, 'preload.js')
        : path.join(process.resourcesPath, 'electron', 'preload.js'),
      webSecurity: true,
      enableRemoteModule: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    icon: process.platform === 'linux' ? path.join(__dirname, '../public/icon.png') : undefined,
    show: false // Не показываем окно до полной загрузки
  });

  // Определяем URL для загрузки
  const startUrl = isDev 
    ? 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true
      });

  console.log(`Загружаем приложение с: ${startUrl}`);
  mainWindow.loadURL(startUrl);

  // Показываем окно после загрузки
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Открыть DevTools в режиме разработки
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // Обработка закрытия окна
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Предотвращаем открытие внешних ссылок в приложении
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Обработка ошибок загрузки
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Ошибка загрузки приложения:', errorCode, errorDescription);
  });
}

// Инициализация приложения
app.whenReady().then(() => {
  createWindow();

  // Регистрация IPC обработчиков
  try {
    apiHandlers.register(ipcMain, store, crypto, ENCRYPTION_KEY, IV_LENGTH);
    fileHandlers.register(ipcMain, app, dialog, fs);
    storageHandlers.register(ipcMain, app, fs, path);
    console.log('IPC обработчики зарегистрированы успешно');
  } catch (error) {
    console.error('Ошибка регистрации IPC обработчиков:', error);
  }

  // Открытие окна при активации приложения (macOS)
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Закрытие приложения (Windows и Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Безопасность: предотвращаем создание новых окон
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Обработчик открытия внешних ссылок
ipcMain.handle('open-external-link', async (event, url) => {
  try {
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
      await shell.openExternal(url);
      return { success: true };
    }
    return { error: 'Недопустимая ссылка' };
  } catch (error) {
    console.error('Ошибка открытия внешней ссылки:', error);
    return { error: error.message };
  }
});

// Обработчик перезапуска приложения
ipcMain.handle('restart-app', () => {
  app.relaunch();
  app.exit();
});

// Базовые обработчики для информации о приложении
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-platform', () => {
  return process.platform;
});

// Обработка неперехваченных ошибок
process.on('uncaughtException', (error) => {
  console.error('Неперехваченная ошибка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необработанное отклонение промиса:', reason);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Завершение работы приложения...');
  if (mainWindow) {
    mainWindow.close();
  }
  app.quit();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);