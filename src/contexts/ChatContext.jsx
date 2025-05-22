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
        chats: [action.payload, ...state.chats],
        activeChat: action.payload,
        messages: [], // Очищаем сообщения для нового чата
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
    if (state.activeChat && state.activeChat.id) {
      loadMessages(state.activeChat.id);
    } else {
      // Если нет активного чата, очищаем сообщения
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: [] });
    }
  }, [state.activeChat]);

  // Load all chats
  const loadChats = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке чатов');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      console.log('ChatContext: загружаем чаты...');
      const chats = await window.electronAPI.getChats();
      console.log('ChatContext: получено чатов:', chats?.length || 0);
      
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
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке сообщений');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      console.log('ChatContext: загружаем сообщения для чата:', chatId);
      const messages = await window.electronAPI.getMessages(chatId);
      console.log('ChatContext: получено сообщений:', messages?.length || 0);
      
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages || [] });
    } catch (error) {
      console.error('Error loading messages:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Load chat by ID - ИСПРАВЛЕННАЯ ВЕРСИЯ БЕЗ АВТОСОЗДАНИЯ
  const loadChat = async (chatId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // ИСПРАВЛЕНО: НЕ создаем чат автоматически для "new"
      if (chatId === 'new') {
        console.log('ChatContext: запрошен новый чат, но не создаем автоматически');
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: null });
        dispatch({ type: ActionTypes.SET_MESSAGES, payload: [] });
        return null;
      }
      
      // Находим чат в существующих, если он загружен
      let chat = state.chats.find(c => c.id === chatId);
      
      // Если чата нет в кэше или мы перезагружаем страницу
      if (!chat || !state.chats.length) {
        // Проверяем доступность electronAPI
        if (!window.electronAPI) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        if (!window.electronAPI) {
          console.error('electronAPI не доступен при загрузке чата');
          dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
          return null;
        }
        
        // Загружаем все чаты, если их еще нет
        if (!state.chats.length) {
          console.log('ChatContext: загружаем все чаты для поиска чата:', chatId);
          const chats = await window.electronAPI.getChats();
          dispatch({ type: ActionTypes.SET_CHATS, payload: chats || [] });
          chat = chats?.find(c => c.id === chatId);
        }
      }
      
      if (chat) {
        console.log('ChatContext: найден чат:', chat.id);
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: chat });
        return chat;
      } else {
        console.log('ChatContext: чат не найден:', chatId);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Чат не найден' });
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: null });
        return null;
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  };

  // Create a new chat - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const createChat = useCallback(async (title) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при создании чата');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const newChat = {
        id: uuidv4(),
        title: title || 'Новый чат',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      console.log('ChatContext: создаем новый чат:', newChat);
      
      // Отправляем запрос на создание чата в базе данных
      const result = await window.electronAPI.createChat(newChat);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Ошибка создания чата');
      }
      
      console.log('ChatContext: чат успешно создан в БД');
      
      // Добавляем чат в состояние
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
        await new Promise(resolve => setTimeout(resolve, 500));
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
        updated_at: new Date().toISOString(),
      };
      
      console.log('ChatContext: обновляем чат:', updatedChat.id);
      
      // Отправляем запрос на обновление чата в базе данных
      const result = await window.electronAPI.updateChat(updatedChat);
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Ошибка обновления чата');
      }
      
      console.log('ChatContext: чат успешно обновлен в БД');
      
      // Обновляем чат в состоянии
      dispatch({ type: ActionTypes.UPDATE_CHAT, payload: updatedChat });
      
      return updatedChat;
    } catch (error) {
      console.error('Error updating chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.chats]);

  // Delete a chat - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const deleteChat = useCallback(async (chatId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!chatId) {
        console.error('ChatContext: не указан ID чата для удаления');
        return false;
      }
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при удалении чата');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return false;
      }
      
      console.log('ChatContext: удаляем чат:', chatId);
      
      // ИСПРАВЛЕНО: Сначала удаляем из БД, потом из состояния
      try {
        const result = await window.electronAPI.deleteChat(chatId);
        
        if (result && result.success) {
          console.log('ChatContext: чат успешно удален из БД');
          
          // Удаляем из локального состояния только после успешного удаления из БД
          dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
          
          return true;
        } else {
          console.error('ChatContext: ошибка удаления чата из БД:', result?.error);
          
          // Все равно удаляем из локального состояния для консистентности UI
          dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
          
          return true; // Возвращаем true для UI, чтобы показать что чат "удален"
        }
      } catch (apiError) {
        console.error('ChatContext: ошибка API при удалении чата:', apiError);
        
        // Удаляем из локального состояния даже если произошла ошибка API
        dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
        
        return true; // Возвращаем true для UI
      }
    } catch (error) {
      console.error('ChatContext: общая ошибка при удалении чата:', error);
      
      // В любом случае удаляем из локального состояния
      if (chatId) {
        dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
      }
      
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return true; // Возвращаем true для UI, чтобы показать что чат "удален"
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Send message to Claude AI - ИСПРАВЛЕННАЯ ВЕРСИЯ
  const sendMessage = useCallback(async (content, files = [], projectFiles = []) => {
    // ИСПРАВЛЕНО: Проверяем или создаем чат если нужно
    let currentChat = state.activeChat;
    
    if (!currentChat) {
      console.log('ChatContext: нет активного чата, создаем новый для отправки сообщения');
      currentChat = await createChat('Новый чат');
      
      if (!currentChat) {
        throw new Error('Не удалось создать чат для отправки сообщения');
      }
    }

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при отправке сообщения');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }

      console.log('ChatContext: sendMessage вызван с параметрами:', {
        chatId: currentChat.id,
        contentLength: content?.length || 0,
        filesCount: files?.length || 0,
        projectFilesCount: projectFiles?.length || 0
      });
      
      // Шаг 1: Загрузка файлов сообщения, если они есть
      let messageAttachments = [];
      if (files.length > 0) {
        messageAttachments = await Promise.all(
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
                  isProjectFile: false // Это файл сообщения
                };
              }
              
              // Иначе загружаем файл на сервер
              if (file.file && window.electronAPI) {
                console.log('ChatContext: загрузка файла через Electron API:', file.name);
                
                try {
                  const result = await window.electronAPI.uploadFile(file.file);
                  
                  if (result && result.success) {
                    return {
                      id: uuidv4(),
                      name: file.name,
                      path: result.path,
                      type: file.type,
                      size: file.size,
                      isProjectFile: false // Это файл сообщения
                    };
                  } else {
                    throw new Error(result?.error || 'Ошибка загрузки файла');
                  }
                } catch (uploadError) {
                  console.error('ChatContext: ошибка загрузки файла:', uploadError);
                  throw uploadError;
                }
              }
              
              return null;
            } catch (fileError) {
              console.error('ChatContext: ошибка при обработке файла:', fileError);
              return null;
            }
          })
        );
        
        // Фильтруем null значения
        messageAttachments = messageAttachments.filter(a => a !== null);
      }
      
      // Шаг 2: Создаем объект сообщения пользователя (БЕЗ файлов проекта в attachments)
      const userMessage = {
        id: uuidv4(),
        chatId: currentChat.id,
        content,
        role: 'user',
        timestamp: new Date().toISOString(),
        attachments: messageAttachments // Только файлы сообщения
      };
      
      // Шаг 3: Сохраняем сообщение пользователя в базе данных
      const savedUserMessage = await window.electronAPI.createMessage(userMessage);
      
      if (!savedUserMessage || !savedUserMessage.success) {
        throw new Error(savedUserMessage?.error || 'Ошибка сохранения сообщения');
      }
      
      console.log('ChatContext: сообщение пользователя сохранено в БД');
      
      // Добавляем сообщение в состояние
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
      
      // Шаг 4: Подготавливаем ВСЕ файлы для отправки в Claude API
      const allAttachmentsForAPI = [...messageAttachments];
      
      // Добавляем файлы проекта как контекст с специальной пометкой
      if (projectFiles && projectFiles.length > 0) {
        console.log('ChatContext: добавляем файлы проекта в контекст для API:', projectFiles.length);
        projectFiles.forEach(projectFile => {
          allAttachmentsForAPI.push({
            id: projectFile.id,
            name: projectFile.name,
            path: projectFile.path,
            type: projectFile.type,
            size: projectFile.size,
            isProjectFile: true // ВАЖНО: Помечаем как файл проекта
          });
        });
        
        console.log('ChatContext: всего файлов для API (сообщение + проект):', allAttachmentsForAPI.length);
      }
      
      // Шаг 5: Отправляем сообщение в Claude API со ВСЕМИ файлами
      const claudeResponse = await window.electronAPI.sendToClaudeAI(
        content,
        allAttachmentsForAPI, // Файлы сообщения + файлы проекта с пометками
        state.messages // История сообщений
      );
      
      if (!claudeResponse || claudeResponse.error) {
        throw new Error(claudeResponse?.error || 'Ошибка получения ответа от Claude');
      }
      
      console.log('ChatContext: получен ответ от Claude API');
      
      // Шаг 6: Создаем и сохраняем ответное сообщение от Claude
      const assistantMessage = {
        id: uuidv4(),
        chatId: currentChat.id,
        content: claudeResponse.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      const savedAssistantMessage = await window.electronAPI.createMessage(assistantMessage);
      
      if (!savedAssistantMessage || !savedAssistantMessage.success) {
        throw new Error(savedAssistantMessage?.error || 'Ошибка сохранения ответа');
      }
      
      console.log('ChatContext: ответ Claude сохранен в БД');
      
      // Добавляем ответное сообщение в состояние
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });
      
      // Шаг 7: Обновляем метаданные чата
      await updateChat(currentChat.id, {
        updated_at: new Date().toISOString()
      });
      
      console.log('ChatContext: сообщение успешно отправлено с файлами проекта:', projectFiles.length);
      
      return { userMessage, assistantMessage };
    } catch (error) {
      console.error('ChatContext: ошибка отправки сообщения:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.activeChat, state.messages, updateChat, createChat]);

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
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
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