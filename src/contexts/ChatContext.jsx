import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  chats: [],
  activeChat: null,
  messages: [],
  isLoading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CHATS: 'SET_CHATS',
  SET_ACTIVE_CHAT: 'SET_ACTIVE_CHAT',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  DELETE_MESSAGE: 'DELETE_MESSAGE',
  CREATE_CHAT: 'CREATE_CHAT',
  UPDATE_CHAT: 'UPDATE_CHAT',
  DELETE_CHAT: 'DELETE_CHAT',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer for state management
const chatReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    case ActionTypes.SET_CHATS:
      return { ...state, chats: action.payload, isLoading: false };
    case ActionTypes.SET_ACTIVE_CHAT:
      return { ...state, activeChat: action.payload, isLoading: false };
    case ActionTypes.SET_MESSAGES:
      return { ...state, messages: action.payload, isLoading: false };
    case ActionTypes.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
        isLoading: false,
      };
    case ActionTypes.UPDATE_MESSAGE:
      return {
        ...state,
        messages: state.messages.map(message =>
          message.id === action.payload.id
            ? { ...message, ...action.payload, isEdited: true }
            : message
        ),
        isLoading: false,
      };
    case ActionTypes.DELETE_MESSAGE:
      return {
        ...state,
        messages: state.messages.filter(message => message.id !== action.payload),
        isLoading: false,
      };
    case ActionTypes.CREATE_CHAT:
      return {
        ...state,
        chats: [...state.chats, action.payload],
        activeChat: action.payload,
        isLoading: false,
      };
    case ActionTypes.UPDATE_CHAT:
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat.id === action.payload.id ? { ...chat, ...action.payload } : chat
        ),
        activeChat: state.activeChat?.id === action.payload.id
          ? { ...state.activeChat, ...action.payload }
          : state.activeChat,
        isLoading: false,
      };
    case ActionTypes.DELETE_CHAT:
      return {
        ...state,
        chats: state.chats.filter(chat => chat.id !== action.payload),
        activeChat: state.activeChat?.id === action.payload ? null : state.activeChat,
        messages: state.activeChat?.id === action.payload ? [] : state.messages,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Create context
const ChatContext = createContext();

// Provider component
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (state.activeChat) {
      loadMessages(state.activeChat.id);
    }
  }, [state.activeChat]);

  // Load all chats
  const loadChats = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке чатов');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      const chats = await window.electronAPI.getChats();
      console.log('Загружено чатов:', chats?.length || 0);
      dispatch({ type: ActionTypes.SET_CHATS, payload: chats || [] });
    } catch (error) {
      console.error('Error loading chats:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Load messages for a specific chat
  const loadMessages = async (chatId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке сообщений');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      const messages = await window.electronAPI.getMessages(chatId);
      console.log(`Загружено сообщений для чата ${chatId}:`, messages?.length || 0);
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages || [] });
    } catch (error) {
      console.error('Error loading messages:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Load chat by ID
  const loadChat = async (chatId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Если это "new", создаем новый чат
      if (chatId === 'new') {
        const newChat = await createChat('Новый чат');
        return newChat;
      }
      
      // Находим чат в существующих, если он загружен
      let chat = state.chats.find(c => c.id === chatId);
      
      // Если чата нет в кэше или мы перезагружаем страницу
      if (!chat || !state.chats.length) {
        // Проверяем доступность electronAPI
        if (!window.electronAPI) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        if (!window.electronAPI) {
          console.error('electronAPI не доступен при загрузке чата');
          dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
          return null;
        }
        
        // Загружаем все чаты, если их еще нет
        if (!state.chats.length) {
          const chats = await window.electronAPI.getChats();
          dispatch({ type: ActionTypes.SET_CHATS, payload: chats || [] });
          chat = chats?.find(c => c.id === chatId);
        }
      }
      
      if (chat) {
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: chat });
        return chat;
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Чат не найден' });
        return null;
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  };

  // Create a new chat
  const createChat = useCallback(async (title) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при создании чата');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const newChat = {
        id: uuidv4(),
        title: title || 'Новый чат',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Создание нового чата:', newChat);
      
      // Отправляем запрос на создание чата в базе данных
      const result = await window.electronAPI.createChat(newChat);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Ошибка создания чата');
      }
      
      dispatch({ type: ActionTypes.CREATE_CHAT, payload: newChat });
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Update a chat
  const updateChat = useCallback(async (chatId, updates) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при обновлении чата');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const chat = state.chats.find(c => c.id === chatId);
      if (!chat) {
        throw new Error('Чат не найден');
      }
      
      const updatedChat = {
        ...chat,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('Обновление чата:', updatedChat);
      
      // Отправляем запрос на обновление чата в базе данных
      const result = await window.electronAPI.updateChat(updatedChat);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Ошибка обновления чата');
      }
      
      dispatch({ type: ActionTypes.UPDATE_CHAT, payload: updatedChat });
      return updatedChat;
    } catch (error) {
      console.error('Error updating chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.chats]);

  // Delete a chat
  const deleteChat = useCallback(async (chatId) => {
  try {
    if (!chatId) {
      console.error('Не указан ID чата для удаления');
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'ID чата не указан' });
      return false;
    }
    
    console.log(`Запрос на удаление чата ID: ${chatId}`);
    dispatch({ type: ActionTypes.SET_LOADING, payload: true });
    
    // Дождёмся готовности electronAPI
    const waitForElectronAPI = async (maxAttempts = 50) => {
      let attempts = 0;
      while (!window.electronAPI && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      return !!window.electronAPI;
    };
    
    const hasElectronAPI = await waitForElectronAPI();
    
    if (!hasElectronAPI) {
      console.error('electronAPI не доступен при удалении чата');
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
      return false;
    }
    
    try {
      // ИСПРАВЛЕНО: Сначала удаляем из базы данных, затем из UI
      console.log(`Отправка запроса на удаление чата ${chatId} в БД`);
      const result = await window.electronAPI.deleteChat(chatId);
      
      if (!result || !result.success) {
        console.error(`Ошибка при удалении чата ${chatId} из БД:`, result?.error);
        dispatch({ type: ActionTypes.SET_ERROR, payload: `Ошибка удаления: ${result?.error || 'Неизвестная ошибка'}` });
        return false;
      }
      
      console.log(`Чат ${chatId} успешно удален из БД, обновляем UI`);
      
      // Только после успешного удаления из БД удаляем из UI
      dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
      
      console.log(`Чат полностью удален из приложения`);
      return true;
    } catch (apiError) {
      console.error(`Ошибка вызова API при удалении чата ${chatId}:`, apiError);
      dispatch({ type: ActionTypes.SET_ERROR, payload: `Ошибка API: ${apiError.message || apiError}` });
      return false;
    }
  } catch (error) {
    console.error(`Критическая ошибка при удалении чата ${chatId}:`, error);
    dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    return false;
  } finally {
    dispatch({ type: ActionTypes.SET_LOADING, payload: false });
  }
}, []);

  // Send message to Claude AI
  const sendMessage = useCallback(async (content, files = [], projectFiles = []) => {
    if (!state.activeChat) return null;

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при отправке сообщения');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      // Шаг 1: Загрузка файлов, если они есть
      let attachments = [];
      if (files.length > 0) {
        attachments = await Promise.all(
          files.map(async (file) => {
            try {
              // Если файл уже имеет путь, используем его
              if (file.path) {
                return {
                  id: file.id || uuidv4(),
                  name: file.name,
                  path: file.path,
                  type: file.type,
                  size: file.size,
                };
              }
              
              // Иначе загружаем файл на сервер
              if (file.file && window.electronAPI) {
                console.log('Загрузка файла через Electron API:', file.name);
                
                try {
                  const result = await window.electronAPI.uploadFile(file.file);
                  
                  if (result && result.success) {
                    return {
                      id: uuidv4(),
                      name: file.name,
                      path: result.path,
                      type: file.type,
                      size: file.size,
                    };
                  } else {
                    throw new Error(result?.error || 'Ошибка загрузки файла');
                  }
                } catch (uploadError) {
                  console.error('Ошибка загрузки файла:', uploadError);
                  throw uploadError;
                }
              }
              
              return null;
            } catch (fileError) {
              console.error('Ошибка при обработке файла:', fileError);
              return null;
            }
          })
        );
        
        // Фильтруем null значения (файлы с ошибками)
        attachments = attachments.filter(a => a !== null);
      }
      
      // Шаг 2: Создаем объект сообщения пользователя
      const userMessage = {
        id: uuidv4(),
        chatId: state.activeChat.id,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        attachments
      };
      
      // Шаг 3: Сохраняем сообщение пользователя в базе данных
      const savedUserMessage = await window.electronAPI.createMessage(userMessage);
      
      if (!savedUserMessage || !savedUserMessage.success) {
        throw new Error(savedUserMessage?.error || 'Ошибка сохранения сообщения');
      }
      
      // Добавляем сообщение в состояние
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
      
      // Подготовка файлов проекта, если они есть
      const projectFilesForSending = projectFiles && projectFiles.length > 0 
        ? projectFiles.map(file => ({
          name: file.name,
          path: file.path,
          type: file.type,
          size: file.size
        }))
        : [];
      
      console.log(`Отправка сообщения с ${attachments.length} файлами и ${projectFilesForSending.length} файлами проекта`);
      
      // Шаг 4: Отправляем сообщение в Claude API с учетом файлов проекта
      const claudeResponse = await window.electronAPI.sendToClaudeAI(
        content,
        attachments,
        state.messages,
        projectFilesForSending // Передаем файлы проекта в API
      );
      
      if (!claudeResponse || claudeResponse.error) {
        throw new Error(claudeResponse?.error || 'Ошибка получения ответа от Claude');
      }
      
      // Шаг 5: Создаем и сохраняем ответное сообщение от Claude
      const assistantMessage = {
        id: uuidv4(),
        chatId: state.activeChat.id,
        content: claudeResponse.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      const savedAssistantMessage = await window.electronAPI.createMessage(assistantMessage);
      
      if (!savedAssistantMessage || !savedAssistantMessage.success) {
        throw new Error(savedAssistantMessage?.error || 'Ошибка сохранения ответа');
      }
      
      // Добавляем ответное сообщение в состояние
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });
      
      // Шаг 6: Обновляем метаданные чата (дата последнего обновления)
      await updateChat(state.activeChat.id, {
        updatedAt: new Date().toISOString()
      });
      
      return { userMessage, assistantMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.activeChat, state.messages, updateChat]);

  // Regenerate last response
  const regenerateLastResponse = useCallback(async () => {
    try {
      // Находим последнюю пару сообщений пользователь-ассистент
      const messages = [...state.messages];
      let lastUserMessageIndex = -1;
      
      // Ищем последнее сообщение пользователя
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }
      
      if (lastUserMessageIndex === -1) {
        throw new Error('Не найдено сообщение пользователя для регенерации ответа');
      }
      
      const userMessage = messages[lastUserMessageIndex];
      
      // Удаляем все сообщения ассистента после последнего сообщения пользователя
      const newMessages = messages.filter((msg, idx) => 
        idx <= lastUserMessageIndex || msg.role !== 'assistant'
      );
      
      // Обновляем состояние, удалив ответ ассистента
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: newMessages });
      
      // Регенерируем ответ
      return await sendMessage(userMessage.content, userMessage.attachments || []);
    } catch (error) {
      console.error('Error regenerating response:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.messages, sendMessage]);

  // Export chat
  const exportChat = useCallback(async (chatId, format = 'markdown') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при экспорте чата');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      // Запрашиваем путь для сохранения файла
      const savePath = await window.electronAPI.saveFileDialog(
        `chat-export-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : format}`,
        [{ name: format.toUpperCase(), extensions: [format === 'markdown' ? 'md' : format] }]
      );
      
      if (!savePath || !savePath.filePath) {
        return null; // Пользователь отменил сохранение
      }
      
      // Запрос на экспорт чата
      const result = await window.electronAPI.exportChat(chatId, format, {
        includeArtifacts: true
      });
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Ошибка экспорта чата');
      }
      
      return savePath.filePath;
    } catch (error) {
      console.error('Error exporting chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Clear error
  const setError = useCallback((error) => {
    if (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    } else {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    }
  }, []);

  // Context value
  const value = {
    currentChat: state.activeChat,
    messages: state.messages,
    chats: state.chats,
    loading: state.isLoading,
    error: state.error,
    createChat,
    updateChat,
    deleteChat,
    loadChat,
    sendMessage,
    regenerateLastResponse,
    exportChat,
    setError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Hook for using chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;