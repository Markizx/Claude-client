// Этот файл используется в основном через IPC в electron/ipc/storage.js
// Здесь приведен только пример структуры для документации

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db = null;

// Инициализация базы данных
export const initDatabase = (dbPath, schemaPath) => {
  try {
    db = new Database(dbPath);
    
    // Загрузка и выполнение схемы БД
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    
    return true;
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
};

// Получение списка чатов
export const getChats = () => {
  try {
    return db.prepare('SELECT * FROM chats WHERE is_archived = 0 ORDER BY updated_at DESC').all();
  } catch (error) {
    console.error('Ошибка получения чатов:', error);
    throw error;
  }
};

// Получение списка проектов
export const getProjects = () => {
  try {
    return db.prepare('SELECT * FROM projects WHERE is_archived = 0 ORDER BY updated_at DESC').all();
  } catch (error) {
    console.error('Ошибка получения проектов:', error);
    throw error;
  }
};

// Получение сообщений чата
export const getChatMessages = (chatId) => {
  try {
    const messages = db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC'
    ).all(chatId);
    
    // Для каждого сообщения ассистента загружаем его артефакты
    const messagesWithArtifacts = messages.map(message => {
      if (message.role === 'assistant') {
        const artifacts = db.prepare(
          'SELECT * FROM artifacts WHERE message_id = ?'
        ).all(message.id);
        
        return { ...message, artifacts };
      }
      return message;
    });
    
    return messagesWithArtifacts;
  } catch (error) {
    console.error(`Ошибка получения сообщений чата ${chatId}:`, error);
    throw error;
  }
};

// Другие функции для работы с базой данных...

export default {
  initDatabase,
  getChats,
  getProjects,
  getChatMessages,
  // Другие функции...
};