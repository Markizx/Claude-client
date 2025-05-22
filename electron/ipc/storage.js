// electron/ipc/storage.js
const { ipcMain, app } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Store = require('electron-store');

// Класс для управления хранилищем настроек (ТОЛЬКО electron-store)
class SettingsStore {
  constructor() {
    this.store = new Store({
      name: 'claude-desktop-settings',
      defaults: {
        // Основные настройки
        language: 'ru',
        theme: 'dark',
        autoSave: true,
        confirmDelete: true,
        
        // Настройки AI
        model: 'claude-3-7-sonnet-20250219',
        maxTokens: 4096,
        temperature: 0.7,
        topP: 1.0,
        
        // Интерфейс
        messageAnimation: true,
        compactMode: false,
        showTimestamps: true,
        fontSize: 14,
        
        // Уведомления
        soundEnabled: true,
        desktopNotifications: true,
        
        // Резервное копирование
        autoBackup: false,
        backupInterval: 24, // часы
        maxBackups: 10,
      }
    });
    
    console.log('SettingsStore инициализирован с настройками:', this.getAllSettings());
  }

  // Получение всех настроек
  getAllSettings() {
    try {
      const settings = this.store.store;
      
      // Всегда проверяем и устанавливаем правильную модель
      if (!settings.model || settings.model !== 'claude-3-7-sonnet-20250219') {
        this.store.set('model', 'claude-3-7-sonnet-20250219');
        settings.model = 'claude-3-7-sonnet-20250219';
      }
      
      console.log('SettingsStore: Загружены настройки:', settings);
      return settings;
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      return this.store.defaults;
    }
  }

  // Сохранение всех настроек
  saveAllSettings(newSettings) {
    try {
      if (!newSettings || typeof newSettings !== 'object') {
        console.error('Неверный формат настроек:', newSettings);
        return false;
      }

      // Получаем текущие настройки
      const currentSettings = this.getAllSettings();
      
      // Объединяем с новыми настройками
      const mergedSettings = { ...currentSettings, ...newSettings };
      
      // Всегда устанавливаем правильную модель
      mergedSettings.model = 'claude-3-7-sonnet-20250219';
      
      // Очищаем null/undefined значения
      const cleanSettings = {};
      for (const [key, value] of Object.entries(mergedSettings)) {
        cleanSettings[key] = value === null || value === undefined ? '' : value;
      }
      
      // Сохраняем все настройки
      this.store.clear();
      this.store.set(cleanSettings);
      
      console.log('SettingsStore: Настройки успешно сохранены:', cleanSettings);
      
      // Уведомляем API handler об изменении настроек
      if (global.apiHandler) {
        global.apiHandler.updateSettings(cleanSettings);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      return false;
    }
  }

  // Обновление одной настройки
  updateSetting(key, value) {
    if (!key) return false;
    
    try {
      // Очищаем null/undefined значения
      const cleanValue = value === null || value === undefined ? '' : value;
      
      this.store.set(key, cleanValue);
      console.log(`SettingsStore: Настройка обновлена: ${key} = ${cleanValue}`);
      
      // Уведомляем API handler об изменении настроек
      if (global.apiHandler) {
        const allSettings = this.getAllSettings();
        global.apiHandler.updateSettings(allSettings);
      }
      
      return true;
    } catch (error) {
      console.error(`Ошибка обновления настройки ${key}:`, error);
      return false;
    }
  }

  // Получение одной настройки
  getSetting(key, defaultValue = null) {
    try {
      return this.store.get(key, defaultValue);
    } catch (error) {
      console.error(`Ошибка получения настройки ${key}:`, error);
      return defaultValue;
    }
  }
  
  // Сброс всех настроек
  resetSettings() {
    try {
      this.store.clear();
      // Устанавливаем дефолтные значения
      this.store.set(this.store.defaults);
      console.log('SettingsStore: Настройки сброшены к значениям по умолчанию');
      
      // Уведомляем API handler об изменении настроек
      if (global.apiHandler) {
        global.apiHandler.updateSettings(this.store.defaults);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка сброса настроек:', error);
      return false;
    }
  }
}

// Database manager class
class StorageManager {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'claude_desktop.db');
    this.db = null;
    this.settingsStore = new SettingsStore();
    this.initialize();
  }

  initialize() {
    try {
      // Проверяем существование директории БД
      const dbDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      // Create database connection
      this.db = new Database(this.dbPath, { 
        verbose: process.env.NODE_ENV === 'development' ? console.log : null 
      });
      
      // Enable WAL mode for better performance
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      
      // Create tables if they don't exist
      this.createTables();
      
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  createTables() {
    // Загружаем и выполняем схему из файла
    try {
      let schemaPath = path.join(app.getAppPath(), 'db', 'schema.sql');
      
      // Проверяем существование файла схемы
      if (!fs.existsSync(schemaPath)) {
        // Альтернативные пути
        const alternativePaths = [
          path.join(process.resourcesPath, 'app', 'db', 'schema.sql'),
          path.join(app.getPath('userData'), 'db', 'schema.sql'),
          path.join(__dirname, '..', '..', 'db', 'schema.sql')
        ];
        
        for (const altPath of alternativePaths) {
          if (fs.existsSync(altPath)) {
            schemaPath = altPath;
            break;
          }
        }
      }
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        this.db.exec(schema);
        console.log('Database schema created from file');
      } else {
        // Создаем основные таблицы, если файл схемы не найден
        console.log('Schema file not found, creating tables manually');
        this.createTablesManually();
      }
    } catch (error) {
      console.error('Error creating tables from schema file:', error);
      // Пробуем создать таблицы вручную в случае ошибки
      this.createTablesManually();
    }
  }

  createTablesManually() {
    // Пользователи
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        api_key TEXT,
        settings TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Чаты
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Сообщения
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        is_edited INTEGER DEFAULT 0,
        edited_at TEXT,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `);

    // Проекты
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);

    // Файлы проектов
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS project_files (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);

    // Вложения сообщений
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_attachments (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    // Артефакты
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT,
        content TEXT NOT NULL,
        language TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      )
    `);

    // Файлы
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        size INTEGER NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    // Создаем индексы для повышения производительности
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_message_attachments_message_id ON message_attachments(message_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_message_id ON artifacts(message_id);
    `);
  }

  // Settings methods - используем ТОЛЬКО SettingsStore
  getAllSettings() {
    return this.settingsStore.getAllSettings();
  }

  updateSettings(settings) {
    const success = this.settingsStore.saveAllSettings(settings);
    return { success };
  }

  updateSetting(key, value) {
    const success = this.settingsStore.updateSetting(key, value);
    return { success };
  }

  getSetting(key, defaultValue = null) {
    return this.settingsStore.getSetting(key, defaultValue);
  }

  resetSettings() {
    const success = this.settingsStore.resetSettings();
    return { success };
  }

  // Chat methods
  getAllChats() {
    try {
      return this.db.prepare('SELECT * FROM chats ORDER BY updated_at DESC').all();
    } catch (error) {
      console.error('Error getting chats:', error);
      return [];
    }
  }

  createChat(chat) {
    try {
      if (!chat || !chat.id) {
        return { success: false, error: 'Invalid chat data' };
      }
      
      const stmt = this.db.prepare(
        'INSERT INTO chats (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)'
      );
      
      stmt.run(
        chat.id,
        chat.title || 'Новый чат',
        chat.createdAt || new Date().toISOString(),
        chat.updatedAt || new Date().toISOString()
      );
      
      return { success: true, chat };
    } catch (error) {
      console.error('Error creating chat:', error);
      return { success: false, error: error.message };
    }
  }

  updateChat(chat) {
    try {
      if (!chat || !chat.id) {
        return { success: false, error: 'Invalid chat data' };
      }
      
      const stmt = this.db.prepare(
        'UPDATE chats SET title = ?, updated_at = ? WHERE id = ?'
      );
      
      stmt.run(
        chat.title || 'Без названия',
        chat.updatedAt || new Date().toISOString(),
        chat.id
      );
      
      return { success: true, chat };
    } catch (error) {
      console.error('Error updating chat:', error);
      return { success: false, error: error.message };
    }
  }

  deleteChat(chatId) {
    try {
      if (!chatId) {
        return { success: false, error: 'Chat ID is required' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Find files to delete
        const attachments = this.db.prepare(`
          SELECT ma.path 
          FROM message_attachments ma
          JOIN messages m ON ma.message_id = m.id
          WHERE m.chat_id = ?
        `).all(chatId);
        
        // Delete message attachments
        this.db.prepare(`
          DELETE FROM message_attachments
          WHERE message_id IN (SELECT id FROM messages WHERE chat_id = ?)
        `).run(chatId);
        
        // Delete artifacts
        this.db.prepare(`
          DELETE FROM artifacts
          WHERE message_id IN (SELECT id FROM messages WHERE chat_id = ?)
        `).run(chatId);
        
        // Delete messages
        this.db.prepare('DELETE FROM messages WHERE chat_id = ?').run(chatId);
        
        // Delete chat
        this.db.prepare('DELETE FROM chats WHERE id = ?').run(chatId);
        
        // Return files to delete
        return attachments;
      });
      
      const filesToDelete = transaction();
      
      // Delete files asynchronously
      setTimeout(() => {
        for (const file of filesToDelete) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (err) {
            console.error(`Error deleting file ${file.path}:`, err);
          }
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting chat:', error);
      return { success: false, error: error.message };
    }
  }

  // Message methods
  getMessagesByChatId(chatId) {
    try {
      if (!chatId) {
        return [];
      }
      
      // Get messages
      const messages = this.db.prepare('SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC').all(chatId);
      
      // Get attachments for each message
      for (const message of messages) {
        message.attachments = this.db.prepare(
          'SELECT * FROM message_attachments WHERE message_id = ?'
        ).all(message.id);
        
        // Get artifacts for each message
        message.artifacts = this.db.prepare(
          'SELECT * FROM artifacts WHERE message_id = ?'
        ).all(message.id);
      }
      
      return messages;
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  createMessage(message) {
    try {
      if (!message || !message.id || !message.chatId) {
        return { success: false, error: 'Invalid message data' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Insert message
        this.db.prepare(
          'INSERT INTO messages (id, chat_id, content, role, timestamp, is_edited) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(
          message.id,
          message.chatId,
          message.content || '',
          message.role || 'user',
          message.timestamp || new Date().toISOString(),
          message.isEdited ? 1 : 0
        );
        
        // Insert attachments if any
        if (message.attachments && message.attachments.length > 0) {
          const attachmentStmt = this.db.prepare(
            'INSERT INTO message_attachments (id, message_id, name, path, type, size) VALUES (?, ?, ?, ?, ?, ?)'
          );
          
          for (const attachment of message.attachments) {
            attachmentStmt.run(
              attachment.id || uuidv4(),
              message.id,
              attachment.name || 'file',
              attachment.path,
              attachment.type || 'application/octet-stream',
              attachment.size || 0
            );
          }
        }
        
        // Insert artifacts if any
        if (message.artifacts && message.artifacts.length > 0) {
          const artifactStmt = this.db.prepare(
            'INSERT INTO artifacts (id, message_id, type, title, content, language, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
          );
          
          for (const artifact of message.artifacts) {
            artifactStmt.run(
              artifact.id || uuidv4(),
              message.id,
              artifact.type || 'text/plain',
              artifact.title || 'Artifact',
              artifact.content || '',
              artifact.language || null,
              new Date().toISOString()
            );
          }
        }
        
        // Update chat timestamps
        this.db.prepare(
          'UPDATE chats SET updated_at = ? WHERE id = ?'
        ).run(
          new Date().toISOString(),
          message.chatId
        );
      });
      
      transaction();
      
      return { success: true, message };
    } catch (error) {
      console.error('Error creating message:', error);
      return { success: false, error: error.message };
    }
  }

  updateMessage(message) {
    try {
      if (!message || !message.id) {
        return { success: false, error: 'Invalid message data' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Update message
        this.db.prepare(
          'UPDATE messages SET content = ?, is_edited = ?, edited_at = ? WHERE id = ?'
        ).run(
          message.content || '',
          1,
          message.editedAt || new Date().toISOString(),
          message.id
        );
        
        // Get chat id for updating timestamp
        const chatRow = this.db.prepare(
          'SELECT chat_id FROM messages WHERE id = ?'
        ).get(message.id);
        
        if (chatRow && chatRow.chat_id) {
          // Update chat timestamps
          this.db.prepare(
            'UPDATE chats SET updated_at = ? WHERE id = ?'
          ).run(
            new Date().toISOString(),
            chatRow.chat_id
          );
        }
      });
      
      transaction();
      
      return { success: true, message };
    } catch (error) {
      console.error('Error updating message:', error);
      return { success: false, error: error.message };
    }
  }

  deleteMessage(messageId) {
    try {
      if (!messageId) {
        return { success: false, error: 'Message ID is required' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Get chat id for updating timestamp
        const messageRow = this.db.prepare(
          'SELECT chat_id FROM messages WHERE id = ?'
        ).get(messageId);
        
        // Get message attachments
        const attachments = this.db.prepare(
          'SELECT * FROM message_attachments WHERE message_id = ?'
        ).all(messageId);
        
        // Delete message attachments from database
        this.db.prepare('DELETE FROM message_attachments WHERE message_id = ?').run(messageId);
        
        // Delete artifacts
        this.db.prepare('DELETE FROM artifacts WHERE message_id = ?').run(messageId);
        
        // Delete message
        this.db.prepare('DELETE FROM messages WHERE id = ?').run(messageId);
        
        // Update chat timestamp if needed
        if (messageRow && messageRow.chat_id) {
          this.db.prepare(
            'UPDATE chats SET updated_at = ? WHERE id = ?'
          ).run(
            new Date().toISOString(),
            messageRow.chat_id
          );
        }
        
        // Return attachments for deletion
        return attachments;
      });
      
      const attachments = transaction();
      
      // Delete files asynchronously
      setTimeout(() => {
        for (const attachment of attachments) {
          try {
            if (fs.existsSync(attachment.path)) {
              fs.unlinkSync(attachment.path);
            }
          } catch (err) {
            console.error(`Error deleting file ${attachment.path}:`, err);
          }
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { success: false, error: error.message };
    }
  }

  // Project methods
  getAllProjects() {
    try {
      return this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
    } catch (error) {
      console.error('Error getting projects:', error);
      return [];
    }
  }

  createProject(project) {
    try {
      if (!project || !project.id) {
        return { success: false, error: 'Invalid project data' };
      }
      
      const stmt = this.db.prepare(
        'INSERT INTO projects (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      );
      
      stmt.run(
        project.id,
        project.name || project.title || 'Новый проект',
        project.description || '',
        project.createdAt || new Date().toISOString(),
        project.updatedAt || new Date().toISOString()
      );
      
      return { success: true, project };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error.message };
    }
  }

  updateProject(project) {
    try {
      if (!project || !project.id) {
        return { success: false, error: 'Invalid project data' };
      }
      
      const stmt = this.db.prepare(
        'UPDATE projects SET name = ?, description = ?, updated_at = ? WHERE id = ?'
      );
      
      stmt.run(
        project.name || project.title || 'Новый проект',
        project.description || '',
        project.updatedAt || new Date().toISOString(),
        project.id
      );
      
      return { success: true, project };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error: error.message };
    }
  }

  deleteProject(projectId) {
    try {
      if (!projectId) {
        return { success: false, error: 'Project ID is required' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Find files to delete
        const files = this.db.prepare(
          'SELECT path FROM project_files WHERE project_id = ?'
        ).all(projectId);
        
        // Delete project files
        this.db.prepare('DELETE FROM project_files WHERE project_id = ?').run(projectId);
        
        // Delete project
        this.db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);
        
        // Return files to delete
        return files;
      });
      
      const filesToDelete = transaction();
      
      // Delete files asynchronously
      setTimeout(() => {
        for (const file of filesToDelete) {
          try {
            if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          } catch (err) {
            console.error(`Error deleting file ${file.path}:`, err);
          }
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error: error.message };
    }
  }

  // Project file methods
  getFilesByProjectId(projectId) {
    try {
      if (!projectId) {
        return [];
      }
      
      return this.db.prepare(
        'SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC'
      ).all(projectId);
    } catch (error) {
      console.error('Error getting project files:', error);
      return [];
    }
  }

  createProjectFile(file) {
    try {
      if (!file || !file.id || !file.projectId) {
        return { success: false, error: 'Invalid file data' };
      }
      
      const stmt = this.db.prepare(`
        INSERT INTO project_files (
          id, project_id, name, description, path, type, size, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        file.id,
        file.projectId,
        file.name || 'Unknown file',
        file.description || '',
        file.path,
        file.type || 'application/octet-stream',
        file.size || 0,
        file.createdAt || new Date().toISOString(),
        file.updatedAt || new Date().toISOString()
      );
      
      // Update project's updatedAt
      this.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(
        new Date().toISOString(),
        file.projectId
      );
      
      return { success: true, file };
    } catch (error) {
      console.error('Error creating project file:', error);
      return { success: false, error: error.message };
    }
  }

  updateProjectFile(file) {
    try {
      if (!file || !file.id) {
        return { success: false, error: 'Invalid file data' };
      }
      
      const stmt = this.db.prepare(`
        UPDATE project_files 
        SET name = ?, description = ?, updated_at = ? 
        WHERE id = ?
      `);
      
      stmt.run(
        file.name || 'Unknown file',
        file.description || '',
        file.updatedAt || new Date().toISOString(),
        file.id
      );
      
      // Get project ID
      const fileData = this.db.prepare('SELECT project_id FROM project_files WHERE id = ?').get(file.id);
      
      if (fileData && fileData.project_id) {
        // Update project's updatedAt
        this.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(
          new Date().toISOString(),
          fileData.project_id
        );
      }
      
      return { success: true, file };
    } catch (error) {
      console.error('Error updating project file:', error);
      return { success: false, error: error.message };
    }
  }

  deleteProjectFile(fileId) {
    try {
      if (!fileId) {
        return { success: false, error: 'File ID is required' };
      }
      
      // Start a transaction
      const transaction = this.db.transaction(() => {
        // Get file info
        const fileData = this.db.prepare('SELECT * FROM project_files WHERE id = ?').get(fileId);
        
        if (!fileData) {
          return null;
        }
        
        // Delete file from database
        this.db.prepare('DELETE FROM project_files WHERE id = ?').run(fileId);
        
        // Update project's updatedAt
        if (fileData.project_id) {
          this.db.prepare('UPDATE projects SET updated_at = ? WHERE id = ?').run(
            new Date().toISOString(),
            fileData.project_id
          );
        }
        
        return fileData;
      });
      
      const fileData = transaction();
      
      // Delete file from disk if it exists
      if (fileData && fileData.path) {
        setTimeout(() => {
          try {
            if (fs.existsSync(fileData.path)) {
              fs.unlinkSync(fileData.path);
            }
          } catch (err) {
            console.error(`Error deleting file ${fileData.path}:`, err);
          }
        }, 100);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting project file:', error);
      return { success: false, error: error.message };
    }
  }

  // Artifact methods
  saveArtifact(artifact) {
    try {
      if (!artifact || !artifact.id || !artifact.messageId) {
        return { success: false, error: 'Invalid artifact data' };
      }
      
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO artifacts (
          id, message_id, type, title, content, language, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        artifact.id,
        artifact.messageId,
        artifact.type || 'text/plain',
        artifact.title || 'Artifact',
        artifact.content || '',
        artifact.language || null,
        artifact.createdAt || new Date().toISOString()
      );
      
      return { success: true, artifact };
    } catch (error) {
      console.error('Error saving artifact:', error);
      return { success: false, error: error.message };
    }
  }

  // Поиск по сообщениям
  searchMessages(query) {
    if (!query || typeof query !== 'string') return [];
    
    try {
      const searchQuery = `%${query}%`;
      
      // Поиск в содержимом сообщений
      const results = this.db.prepare(`
        SELECT m.*, c.title as chat_title 
        FROM messages m
        JOIN chats c ON m.chat_id = c.id
        WHERE m.content LIKE ?
        ORDER BY m.timestamp DESC
        LIMIT 100
      `).all(searchQuery);
      
      return results;
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  // Backup and restore
  backupDatabase(targetPath) {
    try {
      if (!targetPath) {
        return { success: false, error: 'Target path is required' };
      }
      
      // Backup using SQLite's backup API
      const backup = this.db.backup(targetPath);
      
      // Если нужно сохранить и настройки, делаем это дополнительно
      const settingsPath = path.join(path.dirname(targetPath), 'settings.json');
      fs.writeFileSync(settingsPath, JSON.stringify(this.settingsStore.getAllSettings(), null, 2), 'utf8');
      
      return { success: true, filePath: targetPath };
    } catch (error) {
      console.error('Error backing up database:', error);
      return { success: false, error: error.message };
    }
  }

  restoreDatabase(sourcePath) {
    try {
      if (!sourcePath || !fs.existsSync(sourcePath)) {
        return { success: false, error: 'Source file not found' };
      }
      
      // Закрываем текущее подключение
      this.db.close();
      
      // Создаем резервную копию текущей БД
      const backupPath = `${this.dbPath}.backup-${Date.now()}`;
      fs.copyFileSync(this.dbPath, backupPath);
      
      try {
        // Копируем файл резервной копии на место основной БД
        fs.copyFileSync(sourcePath, this.dbPath);
        
        // Проверяем, есть ли настройки рядом с файлом БД
        const settingsPath = path.join(path.dirname(sourcePath), 'settings.json');
        if (fs.existsSync(settingsPath)) {
          try {
            const settingsData = fs.readFileSync(settingsPath, 'utf8');
            const settings = JSON.parse(settingsData);
            this.settingsStore.saveAllSettings(settings);
          } catch (settingsError) {
            console.error('Error restoring settings:', settingsError);
          }
        }
        
        // Переинициализируем подключение к БД
        this.db = new Database(this.dbPath);
        
        return { success: true };
      } catch (restoreError) {
        // В случае ошибки восстанавливаем из резервной копии
        console.error('Error restoring database, rolling back:', restoreError);
        fs.copyFileSync(backupPath, this.dbPath);
        this.db = new Database(this.dbPath);
        
        return { success: false, error: restoreError.message };
      } finally {
        // Удаляем временную резервную копию
        if (fs.existsSync(backupPath)) {
          fs.unlinkSync(backupPath);
        }
      }
    } catch (error) {
      console.error('Error restoring database:', error);
      
      // Пытаемся переинициализировать подключение к БД
      try {
        this.db = new Database(this.dbPath);
      } catch (reconnectError) {
        console.error('Error reconnecting to database:', reconnectError);
      }
      
      return { success: false, error: error.message };
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Create an instance
const storageManager = new StorageManager();

// Close database when app quits
app.on('quit', () => {
  storageManager.close();
});

// Функция для регистрации обработчиков IPC
function register(ipcMainInstance) {
  // Settings handlers
  ipcMainInstance.handle('settings:getAll', async () => {
    try {
      console.log('IPC: получение всех настроек');
      const settings = storageManager.getAllSettings();
      console.log('IPC: настройки получены:', settings);
      return settings;
    } catch (error) {
      console.error('IPC: ошибка получения настроек:', error);
      return {};
    }
  });

  ipcMainInstance.handle('settings:update', async (event, settings) => {
    try {
      console.log('IPC: обновление настроек:', settings);
      const result = storageManager.updateSettings(settings);
      console.log('IPC: результат обновления настроек:', result);
      return result;
    } catch (error) {
      console.error('IPC: ошибка обновления настроек:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMainInstance.handle('settings:updateSingle', async (event, { key, value }) => {
    try {
      console.log(`IPC: обновление настройки ${key}:`, value);
      const result = storageManager.updateSetting(key, value);
      console.log(`IPC: результат обновления настройки ${key}:`, result);
      return result;
    } catch (error) {
      console.error(`IPC: ошибка обновления настройки ${key}:`, error);
      return { success: false, error: error.message };
    }
  });

  ipcMainInstance.handle('settings:getSingle', async (event, { key, defaultValue }) => {
    try {
      console.log(`IPC: получение настройки ${key}`);
      const value = storageManager.getSetting(key, defaultValue);
      console.log(`IPC: настройка ${key} = ${value}`);
      return value;
    } catch (error) {
      console.error(`IPC: ошибка получения настройки ${key}:`, error);
      return defaultValue;
    }
  });

  ipcMainInstance.handle('settings:reset', async () => {
    try {
      console.log('IPC: сброс настроек');
      const result = storageManager.resetSettings();
      console.log('IPC: результат сброса настроек:', result);
      return result;
    } catch (error) {
      console.error('IPC: ошибка сброса настроек:', error);
      return { success: false, error: error.message };
    }
  });

  // Chat handlers
  ipcMainInstance.handle('chats:getAll', async () => storageManager.getAllChats());
  ipcMainInstance.handle('chats:create', async (event, chat) => storageManager.createChat(chat));
  ipcMainInstance.handle('chats:update', async (event, chat) => storageManager.updateChat(chat));
  ipcMainInstance.handle('chats:delete', async (event, chatId) => storageManager.deleteChat(chatId));
  ipcMainInstance.handle('chats:searchMessages', async (event, query) => storageManager.searchMessages(query));

  // Message handlers
  ipcMainInstance.handle('messages:getByChatId', async (event, chatId) => storageManager.getMessagesByChatId(chatId));
  ipcMainInstance.handle('messages:create', async (event, message) => storageManager.createMessage(message));
  ipcMainInstance.handle('messages:update', async (event, message) => storageManager.updateMessage(message));
  ipcMainInstance.handle('messages:delete', async (event, messageId) => storageManager.deleteMessage(messageId));

  // Project handlers
  ipcMainInstance.handle('projects:getAll', async () => storageManager.getAllProjects());
  ipcMainInstance.handle('projects:create', async (event, project) => storageManager.createProject(project));
  ipcMainInstance.handle('projects:update', async (event, project) => storageManager.updateProject(project));
  ipcMainInstance.handle('projects:delete', async (event, projectId) => storageManager.deleteProject(projectId));

  // Project files handlers
  ipcMainInstance.handle('projectFiles:getByProjectId', async (event, projectId) => storageManager.getFilesByProjectId(projectId));
  ipcMainInstance.handle('projectFiles:create', async (event, file) => storageManager.createProjectFile(file));
  ipcMainInstance.handle('projectFiles:update', async (event, file) => storageManager.updateProjectFile(file));
  ipcMainInstance.handle('projectFiles:delete', async (event, fileId) => storageManager.deleteProjectFile(fileId));

  // Database operations
  ipcMainInstance.handle('db:backup', async (event, path) => storageManager.backupDatabase(path));
  ipcMainInstance.handle('db:restore', async (event, path) => storageManager.restoreDatabase(path));

  // Artifact operations
  ipcMainInstance.handle('artifacts:save', async (event, artifact) => storageManager.saveArtifact(artifact));
}

// Экспортируем
module.exports = {
  register,
  storageManager
};