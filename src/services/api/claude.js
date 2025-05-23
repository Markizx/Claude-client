const axios = require('axios');

// Базовый URL для API Claude
const BASE_URL = 'https://api.anthropic.com';

// Создание экземпляра axios с базовыми настройками
const createApiInstance = (apiKey) => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 seconds
  });
};

// Проверка модели на принадлежность к Claude 4
const isClaude4Model = (modelName) => {
  return modelName && (
    modelName.includes('claude-opus-4') || 
    modelName.includes('claude-sonnet-4') ||
    modelName.includes('claude-4')
  );
};

// Отправка сообщения Claude
const sendMessage = async (apiKey, message, files = [], projectFiles = []) => {
  try {
    const api = createApiInstance(apiKey);
    
    // Получаем модель из настроек (в реальном приложении нужно передавать из настроек)
    const modelName = 'claude-3-7-sonnet-20250219'; // Значение по умолчанию
    const isClaude4 = isClaude4Model(modelName);
    
    // Создаем объект запроса
    const requestData = {
      model: modelName,
      max_tokens: isClaude4 ? 8192 : 4096,
      messages: [
        {
          role: 'user',
          content: []
        }
      ],
      temperature: 0.7,
      system: `Ты полезный ассистент Claude. Если пользователь прикрепил файлы, анализируй их содержимое и отвечай на основе этих данных. 

Правила для артефактов:
- Используй тег <artifact> для создания кода, документов и визуализаций
- Обязательные атрибуты: identifier (уникальный ID), type, title
- Поддерживаемые типы:
  * application/vnd.ant.code - для кода (добавь language="язык")
  * text/markdown - для документов
  * application/vnd.ant.react - для React компонентов
  * image/svg+xml - для SVG
  * text/html - для HTML страниц

Всегда отвечай на русском языке, если не попросят иначе.${
    isClaude4 ? `\n\nТы используешь модель ${modelName} из семейства Claude 4. Используй свои расширенные возможности для более глубокого анализа и генерации качественного контента.` : ''
  }`
    };
    
    // Добавляем текст сообщения, если он есть
    if (message && message.trim()) {
      requestData.messages[0].content.push({
        type: 'text',
        text: message
      });
    }
    
    // Добавляем контекст проекта, если есть файлы проекта
    if (projectFiles && projectFiles.length > 0) {
      requestData.messages[0].content.push({
        type: 'text',
        text: '\n\n--- Контекст проекта ---'
      });
      
      for (const projectFile of projectFiles) {
        try {
          requestData.messages[0].content.push({
            type: 'text',
            text: `Файл проекта: ${projectFile.name} (${projectFile.type})`
          });
        } catch (error) {
          console.error('Ошибка обработки файла проекта:', error);
        }
      }
      
      requestData.messages[0].content.push({
        type: 'text',
        text: '--- Конец контекста проекта ---\n\n'
      });
    }
    
    // Добавляем прикрепленные файлы
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Для изображений и других файлов добавляем как соответствующие типы контента
          if (file.type && file.type.startsWith('image/')) {
            // В реальном приложении здесь должно быть чтение файла и кодирование в base64
            requestData.messages[0].content.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: file.type,
                data: 'base64_encoded_image_data' // Заглушка, в реальном коде здесь будет настоящий base64
              }
            });
          } else {
            // Для других файлов
            requestData.messages[0].content.push({
              type: 'file',
              source: {
                type: 'base64',
                media_type: file.type || 'application/octet-stream',
                data: 'base64_encoded_file_data' // Заглушка
              }
            });
          }
        } catch (error) {
          console.error('Ошибка обработки файла:', error);
        }
      }
    }

    // Если нет контента, добавляем заглушку
    if (requestData.messages[0].content.length === 0) {
      requestData.messages[0].content.push({
        type: 'text',
        text: 'Привет!'
      });
    }

    console.log('Отправка запроса к Claude API:', JSON.stringify(requestData, null, 2));

    // Увеличиваем таймаут для Claude 4
    if (isClaude4) {
      api.defaults.timeout = 120000; // 2 минуты для Claude 4
    }

    // Отправляем запрос
    const response = await api.post('/v1/messages', requestData);
    
    console.log('Получен ответ от Claude API:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    
    // Более подробная обработка ошибок
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      console.error('Ответ сервера с ошибкой:', {
        status,
        data: errorData
      });
      
      switch (status) {
        case 400:
          throw new Error(`Неверный запрос: ${errorData.error?.message || error.message}`);
        case 401:
          throw new Error('Неверный API ключ');
        case 403:
          throw new Error('Доступ запрещен');
        case 429:
          throw new Error('Превышен лимит запросов. Попробуйте позже.');
        case 500:
          throw new Error('Внутренняя ошибка сервера');
        default:
          throw new Error(`Ошибка сервера (${status}): ${errorData.error?.message || error.message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Превышено время ожидания ответа');
    } else if (error.code === 'ENOTFOUND') {
      throw new Error('Нет подключения к интернету');
    }
    
    throw error;
  }
};

// Проверка валидности API ключа
const checkApiKey = async (apiKey) => {
  if (!apiKey) return false;
  
  try {
    const api = createApiInstance(apiKey);
    
    // Простой запрос для проверки ключа
    const response = await api.post('/v1/messages', {
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [
        { 
          role: 'user', 
          content: [
            {
              type: 'text',
              text: 'Test'
            }
          ]
        }
      ]
    });
    
    return response.status === 200;
  } catch (error) {
    console.error('Ошибка проверки API ключа:', error);
    return false;
  }
};

module.exports = {
  sendMessage,
  checkApiKey,
  isClaude4Model,
};