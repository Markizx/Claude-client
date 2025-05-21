// electron/main.js
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
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

console.log('Режим приложения:', isDev ? 'Разработка' : 'Продакшн');

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
    path.join(userDataPath, 'storage/temp'),
    path.join(userDataPath, 'db')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Создана директория: ${dir}`);
    }
  });
}

// Загрузка модулей IPC
function loadIPCModules() {
  try {
    // Пути к модулям в зависимости от режима
    let basePath;
    if (isDev) {
      basePath = path.join(__dirname, 'ipc');
    } else {
      // Альтернативные пути для продакшн-режима
      const possiblePaths = [
        path.join(__dirname, 'ipc'),
        path.join(__dirname, 'electron', 'ipc'),
        path.join(app.getAppPath(), 'electron', 'ipc'),
        path.join(process.resourcesPath, 'app', 'electron', 'ipc')
      ];
      
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(path.join(possiblePath, 'api.js'))) {
          basePath = possiblePath;
          break;
        }
      }
      
      if (!basePath) {
        throw new Error('IPC директория не найдена');
      }
    }
    
    console.log('Загрузка IPC модулей из:', basePath);
    
    // Загружаем модули
    const apiHandlers = require(path.join(basePath, 'api.js'));
    console.log('API модуль загружен');
    
    const fileHandlers = require(path.join(basePath, 'files.js'));
    console.log('Files модуль загружен');
    
    const storageHandlers = require(path.join(basePath, 'storage.js'));
    console.log('Storage модуль загружен');
    
    return { apiHandlers, fileHandlers, storageHandlers };
  } catch (error) {
    console.error('Ошибка загрузки IPC модулей:', error);
    
    // Возвращаем заглушки
    return {
      apiHandlers: { register: () => console.log('API handlers not available') },
      fileHandlers: { register: () => console.log('File handlers not available') },
      storageHandlers: { register: () => console.log('Storage handlers not available') }
    };
  }
}

// Создание главного окна
function createWindow() {
  ensureDirectories();

  // Находим путь к preload скрипту
  let preloadPath;
  if (isDev) {
    preloadPath = path.join(__dirname, 'preload.js');
  } else {
    // Проверяем возможные пути
    const possiblePaths = [
      path.join(__dirname, 'preload.js'),
      path.join(app.getAppPath(), 'build', 'preload.js'),
      path.join(process.resourcesPath, 'app', 'preload.js')
    ];
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        preloadPath = p;
        break;
      }
    }
    
    if (!preloadPath) {
      console.error('preload.js не найден! Используем путь по умолчанию.');
      preloadPath = path.join(__dirname, 'preload.js');
    }
  }
  
  console.log('Путь к preload:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: isDev ? false : true,
      enableRemoteModule: false,
      devTools: true
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false // Не показываем окно до полной загрузки
  });

  // Определяем URL для загрузки
  const startUrl = isDev 
    ? process.env.ELECTRON_START_URL || 'http://localhost:3000'
    : url.format({
        pathname: path.join(__dirname, '../build/index.html'),
        protocol: 'file:',
        slashes: true
      });

  console.log(`Загружаем приложение с: ${startUrl}`);
  
  // Загружаем URL
  mainWindow.loadURL(startUrl).catch(error => {
    console.error('Ошибка загрузки URL:', error);
    mainWindow.loadURL('data:text/html,<h1>Ошибка загрузки приложения</h1>');
  });

  // Показываем окно после загрузки
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Открываем DevTools в режиме разработки
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

  // Загружаем и регистрируем IPC обработчики
  const { apiHandlers, fileHandlers, storageHandlers } = loadIPCModules();
  
  try {
    console.log('Регистрация IPC обработчиков...');
    
    // Регистрация обработчиков
    apiHandlers.register(ipcMain);
    console.log('API обработчики зарегистрированы');
    
    fileHandlers.register(ipcMain);
    console.log('File обработчики зарегистрированы');
    
    storageHandlers.register(ipcMain);
    console.log('Storage обработчики зарегистрированы');
    
    // Регистрация дополнительных базовых обработчиков
    setupBasicHandlers();
    
    console.log('Все IPC обработчики зарегистрированы успешно');
    
    // Добавим простой обработчик для диагностики
    ipcMain.handle('app:diagnostics', () => {
      return {
        isReady: true,
        platform: process.platform,
        appPath: app.getAppPath(),
        userData: app.getPath('userData'),
        modules: {
          apiHandlers: !!apiHandlers,
          fileHandlers: !!fileHandlers,
          storageHandlers: !!storageHandlers
        }
      };
    });
  } catch (error) {
    console.error('Ошибка регистрации IPC обработчиков:', error);
  }

  // Добавляем обработчики для открытия окна на macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Регистрация базовых обработчиков
function setupBasicHandlers() {
  // Обработчик открытия внешних ссылок
  ipcMain.handle('app:openExternal', async (event, url) => {
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
  ipcMain.handle('app:restart', () => {
    app.relaunch();
    app.exit();
  });

  // Информация о приложении
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion();
  });

  ipcMain.handle('app:getPlatform', () => {
    return process.platform;
  });

  // Обработчик для уведомлений
  ipcMain.handle('app:showNotification', async (event, { title, body }) => {
    if (process.platform === 'win32') {
      const notification = new Notification({
        title: title || 'Claude Desktop',
        body: body || '',
        icon: path.join(__dirname, '../assets/icon.png')
      });
      notification.show();
      return { success: true };
    } else {
      return { success: false, error: 'Notifications not supported on this platform' };
    }
  });
}

// Закрытие приложения при закрытии всех окон (Windows и Linux)
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