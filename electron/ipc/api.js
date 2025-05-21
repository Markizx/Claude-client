// electron/ipc/api.js
const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const Store = require('electron-store');

// Безопасное хранилище
const store = new Store({
  name: 'claude-desktop-config'
});

// Claude API handler
class ClaudeAPIHandler {
  constructor() {
    this.baseUrl = 'https://api.anthropic.com';
    this.apiVersion = '2023-06-01';
    // Явно устанавливаем модель по умолчанию - ФИКСИРОВАННАЯ МОДЕЛЬ!
    this.defaultModel = 'claude-3-7-sonnet-20250219';
  }

  // Get API key
  async getApiKey() {
    const encryptedKey = store.get('claudeApiKey');
    if (!encryptedKey) return '';
    
    try {
      // Простая версия - без шифрования для отладки
      return encryptedKey;
    } catch (error) {
      console.error('Error decrypting API key:', error);
      return '';
    }
  }
  
  // Set API key
  async setApiKey(apiKey) {
    try {
      // Простая версия - без шифрования для отладки
      store.set('claudeApiKey', apiKey);
      return { success: true };
    } catch (error) {
      console.error('Error setting API key:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Check API key validity
  async checkApiKey(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return false;
    }
    
    try {
      // Simple check request to Claude API
      const response = await axios.post(
        `${this.baseUrl}/v1/messages`,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'API key verification test.'
                }
              ]
            }
          ]
        },
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.status === 200;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('Invalid API key');
        return false;
      }
      
      // Если ошибка не связана с аутентификацией, но сервер ответил,
      // то ключ может быть действительным, но есть другие проблемы
      if (error.response) {
        console.error('API responded with error, but key might be valid:', error.response.status);
        return true;
      }
      
      console.error('Error checking API key:', error);
      return false;
    }
  }

  // Send message to Claude API
  async sendMessageToClaudeAI(content, attachments = [], history = [], projectFiles = []) {
    const apiKey = await this.getApiKey();
    
    if (!apiKey) {
      throw new Error('Claude API key is not configured. Please update your settings.');
    }

    // Prepare message content array
    const messageContent = [];
    
    // Add attachments to the message
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        try {
          // Read the file
          if (!attachment.path || !fs.existsSync(attachment.path)) {
            console.warn(`File not found: ${attachment.path}`);
            continue;
          }
          
          const fileBuffer = fs.readFileSync(attachment.path);
          
          // Determine file type
          const mediaType = this.getMediaType(attachment.type, attachment.name);
          
          // Проверяем, является ли файл изображением
          if (this.isImageFile(mediaType)) {
            // Для изображений используем тип image
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBuffer.toString('base64')
              }
            });
            console.log(`Added image to request: ${attachment.name} (${mediaType})`);
          } else {
            // Для текстовых документов - преобразуем в текст и добавляем как text
            try {
              // Попытка прочитать как текст
              const textContent = fileBuffer.toString('utf8');
              
              messageContent.push({
                type: 'text',
                text: `### Содержимое файла ${attachment.name} ###\n\n${textContent}\n\n### Конец файла ${attachment.name} ###`
              });
              
              console.log(`Added text document to request: ${attachment.name} (${mediaType})`);
            } catch (error) {
              console.error(`Error converting file ${attachment.name} to text:`, error);
              
              // Для бинарных файлов добавляем только информацию о файле
              messageContent.push({
                type: 'text',
                text: `[Прикреплен бинарный файл: ${attachment.name}, тип: ${mediaType}, размер: ${fileBuffer.length} байт]`
              });
            }
          }
        } catch (fileError) {
          console.error(`Error processing file ${attachment.name}:`, fileError);
        }
      }
    }
    
    // Добавляем файлы проекта как контекст
    if (projectFiles && projectFiles.length > 0) {
      console.log(`Обработка ${projectFiles.length} файлов проекта`);
      
      // Добавляем заголовок секции контекста проекта
      messageContent.push({
        type: 'text',
        text: `\n\n### КОНТЕКСТ ПРОЕКТА (${projectFiles.length} файлов) ###\n`
      });
      
      // Обрабатываем каждый файл
      for (const projectFile of projectFiles) {
        try {
          if (!projectFile.path || !fs.existsSync(projectFile.path)) {
            console.warn(`Файл проекта не найден: ${projectFile.path}`);
            continue;
          }
          
          const fileBuffer = fs.readFileSync(projectFile.path);
          const mediaType = this.getMediaType(projectFile.type, projectFile.name);
          
          // Если это изображение
          if (this.isImageFile(mediaType)) {
            messageContent.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: fileBuffer.toString('base64')
              }
            });
            console.log(`Добавлено изображение из проекта: ${projectFile.name} (${mediaType})`);
          } else {
            // Для текстовых файлов
            try {
              const textContent = fileBuffer.toString('utf8');
              
              messageContent.push({
                type: 'text',
                text: `### Файл проекта: ${projectFile.name} ###\n\n${textContent}\n\n`
              });
              
              console.log(`Добавлен текстовый файл из проекта: ${projectFile.name} (${mediaType})`);
            } catch (error) {
              console.error(`Ошибка чтения файла проекта ${projectFile.name}:`, error);
              
              // Для бинарных файлов только информация
              messageContent.push({
                type: 'text',
                text: `[Бинарный файл проекта: ${projectFile.name}, тип: ${mediaType}, размер: ${fileBuffer.length} байт]`
              });
            }
          }
        } catch (fileError) {
          console.error(`Ошибка обработки файла проекта ${projectFile.name}:`, fileError);
        }
      }
      
      // Добавляем разделитель после файлов проекта
      messageContent.push({
        type: 'text',
        text: `\n### КОНЕЦ КОНТЕКСТА ПРОЕКТА ###\n\n`
      });
    }
    
    // Add text content
    messageContent.push({
      type: 'text',
      text: content || 'Привет!'
    });
    
    // Prepare conversation history in Claude's format
    const messages = [];
    
    // Add conversation history
    if (history && history.length > 0) {
      for (const message of history) {
        if (!message || !message.role) continue;
        
        const messageObj = {
          role: message.role,
          content: []
        };
        
        if (message.content) {
          if (typeof message.content === 'string') {
            messageObj.content.push({ 
              type: 'text', 
              text: message.content 
            });
          } else if (Array.isArray(message.content)) {
            messageObj.content = message.content;
          }
        }
        
        messages.push(messageObj);
      }
    }
    
    // Add current message
    messages.push({
      role: 'user',
      content: messageContent
    });
    
    // Системное сообщение
    const systemPrompt = `Ты полезный ассистент Claude. Если пользователь прикрепил файлы, анализируй их содержимое и отвечай на основе этих данных. 

Правила для артефактов:
- Используй тег <artifact> для создания кода, документов и визуализаций
- Обязательные атрибуты: identifier (уникальный ID), type, title
- Поддерживаемые типы:
  * application/vnd.ant.code - для кода (добавь language="язык")
  * text/markdown - для документов
  * application/vnd.ant.react - для React компонентов
  * image/svg+xml - для SVG
  * text/html - для HTML страниц

Всегда отвечай на русском языке, если не попросят иначе.`;
    
    // Получаем настройки модели - НО ИГНОРИРУЕМ ИХ!
    const settingsStore = new Store({ name: 'claude-desktop-settings' });
    let settings = settingsStore.get('settings') || {};
    
    // Важное исправление: получаем настройки напрямую, если они не вложены в объект 'settings'
    if (!settings.model) {
      try {
        settings = settingsStore.get('') || {};
      } catch (error) {
        console.error('Error getting direct settings:', error);
      }
    }
    
    // Используем настройки или значения по умолчанию
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Принудительно используем правильную модель независимо от настроек
    console.log('КРИТИЧЕСКОЕ: Модель Claude принудительно установлена на 3.7 Sonnet!');
    
    // Фиксируем модель жестко
    const modelName = 'claude-3-7-sonnet-20250219'; 
    const maxTokens = settings.maxTokens || 4096;
    const temperature = settings.temperature || 0.7;
    const topP = settings.topP || 1.0;
    
    // Make API request to Claude
    try {
      console.log(`Отправка запроса Claude API с моделью: ${modelName}`);
      
      const requestData = {
        model: modelName, // Здесь используется фиксированная модель
        max_tokens: maxTokens,
        messages: messages,
        system: systemPrompt,
        temperature: temperature,
        top_p: topP
      };
      
      console.log('Request data (without file content):', JSON.stringify({
        ...requestData,
        model: modelName, // Еще раз явно выводим модель для проверки
        messages: requestData.messages.map(msg => ({
          role: msg.role,
          content: Array.isArray(msg.content) 
            ? msg.content.map(c => ({ 
                type: c.type, 
                ...(c.type === 'text' ? { text: c.text.substring(0, 50) + '...' } : { source: { type: c.source?.type, media_type: c.source?.media_type } })
              }))
            : msg.content
        }))
      }, null, 2));
      
      const response = await axios.post(
        `${this.baseUrl}/v1/messages`,
        requestData,
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': this.apiVersion,
            'Content-Type': 'application/json'
          },
          timeout: 60000 // 60 seconds timeout
        }
      );
      
      // Проверяем, какая модель реально использовалась
      console.log(`Полученный ответ от модели: ${response.data.model}`);
      
      // Extract and return Claude's response
      if (response.data && response.data.content && response.data.content.length > 0) {
        // Combine all text elements from the response
        const textContent = response.data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('\n');
          
        return {
          id: response.data.id,
          content: textContent,
          model: response.data.model,
          stopReason: response.data.stop_reason,
          usage: response.data.usage
        };
      } else {
        throw new Error('Received invalid response from Claude API');
      }
    } catch (error) {
      console.error('Error sending message to Claude API:', error);
      
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        // Более детальная информация об ошибке
        if (error.response.data && error.response.data.error) {
          throw new Error(`API Error: ${error.response.data.error.message || error.response.data.error.type}`);
        }
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Timeout: API request took too long to complete');
      } else if (error.code === 'ENOTFOUND') {
        throw new Error('Network error: Could not connect to API server');
      }
      
      throw error;
    }
  }
  
  // Helper to determine media type
  getMediaType(mimeType, fileName) {
    if (mimeType && mimeType !== 'application/octet-stream') return mimeType;
    
    // Fallback to extension-based detection
    const ext = path.extname(fileName || '').toLowerCase();
    
    const mimeTypes = {
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.css': 'text/css',
      '.js': 'text/javascript',
      '.jsx': 'text/javascript',
      '.ts': 'text/javascript',
      '.tsx': 'text/javascript',
      '.json': 'application/json',
      '.csv': 'text/csv',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  // Helper to determine if file is an image
  isImageFile(mimeType) {
    return mimeType && mimeType.startsWith('image/');
  }
}

// Создаем экземпляр обработчика
const apiHandler = new ClaudeAPIHandler();

// Функция для регистрации обработчиков IPC
function register(ipcMainInstance) {
  // API Key handling
  ipcMainInstance.handle('auth:getApiKey', async () => {
    try {
      return await apiHandler.getApiKey();
    } catch (error) {
      console.error('Error getting API key:', error);
      return '';
    }
  });

  ipcMainInstance.handle('auth:setApiKey', async (_event, apiKey) => {
    try {
      return await apiHandler.setApiKey(apiKey);
    } catch (error) {
      console.error('Error setting API key:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMainInstance.handle('auth:checkApiKey', async (_event, apiKey) => {
    try {
      return await apiHandler.checkApiKey(apiKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      return false;
    }
  });
  
  // ВАЖНОЕ ИСПРАВЛЕНИЕ: добавляем параметр projectFiles
  // Send message to Claude AI
  ipcMainInstance.handle('api:sendToClaudeAI', async (_event, { content, attachments = [], history = [], projectFiles = [] }) => {
    try {
      console.log(`Отправка сообщения в Claude с ${attachments.length} вложениями и ${projectFiles.length} файлами проекта`);
      return await apiHandler.sendMessageToClaudeAI(content, attachments, history, projectFiles);
    } catch (error) {
      console.error('Claude API error:', error);
      return { error: error.message || 'Unknown error' };
    }
  });
}

// Экспортируем
module.exports = {
  register,
  apiHandler
};