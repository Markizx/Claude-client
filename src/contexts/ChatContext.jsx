import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
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
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
};

// Оптимизированный reducer с иммутабельными обновлениями
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
    case ActionTypes.CLEAR_MESSAGES:
      return { ...state, messages: [], isLoading: false };
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
        messages: [],
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

  // ИСПРАВЛЕНО: убираем агрессивное кеширование
  const chatsLoadedRef = React.useRef(false);
  const currentChatIdRef = React.useRef(null);

  // Оптимизированная загрузка чатов
  const loadChats = useCallback(async () => {
    if (chatsLoadedRef.current) return;
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!window.electronAPI) {
          throw new Error('API недоступен');
        }
      }
      
      const chats = await window.electronAPI.getChats();
      dispatch({ type: ActionTypes.SET_CHATS, payload: chats || [] });
      chatsLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading chats:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // ИСПРАВЛЕНО: загрузка сообщений без кеширования
  const loadMessages = useCallback(async (chatId, force = false) => {
    if (!chatId) {
      dispatch({ type: ActionTypes.CLEAR_MESSAGES });
      return;
    }
    
    // ИСПРАВЛЕНО: всегда загружаем сообщения при смене чата
    if (!force && currentChatIdRef.current === chatId) {
      return; // Загружаем только если это другой чат
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      console.log('ChatContext: загружаем сообщения для чата:', chatId);
      const messages = await window.electronAPI.getMessages(chatId);
      console.log('ChatContext: получено сообщений:', messages?.length || 0);
      
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: messages || [] });
      currentChatIdRef.current = chatId;
    } catch (error) {
      console.error('Error loading messages:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // Загрузка чатов только при монтировании
  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // ИСПРАВЛЕНО: правильная обработка смены активного чата
  const loadChat = useCallback(async (chatId) => {
    try {
      console.log('ChatContext: loadChat вызван для:', chatId);
      
      if (chatId === 'new') {
        console.log('ChatContext: устанавливаем новый чат');
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: null });
        dispatch({ type: ActionTypes.CLEAR_MESSAGES });
        currentChatIdRef.current = null;
        return null;
      }
      
      // ИСПРАВЛЕНО: всегда перезагружаем чаты если они не загружены
      if (!chatsLoadedRef.current) {
        await loadChats();
      }
      
      // Ищем чат в загруженных данных
      let chat = state.chats.find(c => c.id === chatId);
      
      // ИСПРАВЛЕНО: если чат не найден, перезагружаем список чатов
      if (!chat) {
        console.log('ChatContext: чат не найден, перезагружаем список чатов');
        chatsLoadedRef.current = false;
        await loadChats();
        
        // Ждем обновления состояния и ищем снова
        await new Promise(resolve => setTimeout(resolve, 100));
        chat = state.chats.find(c => c.id === chatId);
      }
      
      if (chat) {
        console.log('ChatContext: устанавливаем активный чат:', chat.title);
        dispatch({ type: ActionTypes.SET_ACTIVE_CHAT, payload: chat });
        
        // ИСПРАВЛЕНО: принудительно загружаем сообщения для этого чата
        await loadMessages(chatId, true);
        
        return chat;
      } else {
        console.error('ChatContext: чат не найден:', chatId);
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'Чат не найден' });
        return null;
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.chats, loadChats, loadMessages]);

  // Создание чата
  const createChat = useCallback(async (title) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      const newChat = {
        id: uuidv4(),
        title: title || 'Новый чат',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const result = await window.electronAPI.createChat(newChat);
      
      if (!result?.success) {
        throw new Error(result?.error || 'Ошибка создания чата');
      }
      
      dispatch({ type: ActionTypes.CREATE_CHAT, payload: newChat });
      currentChatIdRef.current = newChat.id;
      
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Обновление чата
  const updateChat = useCallback(async (chatId, updates) => {
    try {
      const chat = state.chats.find(c => c.id === chatId);
      if (!chat) throw new Error('Чат не найден');
      
      const updatedChat = {
        ...chat,
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      // Оптимистично обновляем UI
      dispatch({ type: ActionTypes.UPDATE_CHAT, payload: updatedChat });
      
      // Затем сохраняем в БД
      if (window.electronAPI) {
        await window.electronAPI.updateChat(updatedChat);
      }
      
      return updatedChat;
    } catch (error) {
      console.error('Error updating chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.chats]);

  // Удаление чата
  const deleteChat = useCallback(async (chatId) => {
    try {
      if (!chatId) return false;
      
      // Оптимистично удаляем из UI
      dispatch({ type: ActionTypes.DELETE_CHAT, payload: chatId });
      
      // Если удаляем текущий чат, очищаем ссылки
      if (currentChatIdRef.current === chatId) {
        currentChatIdRef.current = null;
      }
      
      // Затем удаляем из БД
      if (window.electronAPI) {
        await window.electronAPI.deleteChat(chatId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting chat:', error);
      return true; // Возвращаем true для UI
    }
  }, []);

  // ИСПРАВЛЕНО: отправка сообщения с правильной обработкой состояния
  const sendMessage = useCallback(async (content, files = [], projectFiles = []) => {
    // ВАЖНО: Проверяем, что есть контент или файлы
    if (!content?.trim() && (!files || files.length === 0) && (!projectFiles || projectFiles.length === 0)) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'Нельзя отправить пустое сообщение' });
      return null;
    }

    let currentChat = state.activeChat;
    
    // Создаем чат если нужно
    if (!currentChat) {
      currentChat = await createChat('Новый чат');
      if (!currentChat) throw new Error('Не удалось создать чат');
    }

    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) throw new Error('API недоступен');

      // ВАЖНО: Если нет текста, но есть файлы, добавляем описание
      let messageContent = content?.trim() || '';
      if (!messageContent && (files.length > 0 || projectFiles.length > 0)) {
        messageContent = 'Пожалуйста, проанализируйте прикрепленные файлы.';
      }

      // Подготавливаем файлы сообщения
      const messageAttachments = await Promise.all(
        files.map(async (file) => {
          if (file.path) {
            return {
              id: file.id || uuidv4(),
              name: file.name,
              path: file.path,
              type: file.type,
              size: file.size,
              isProjectFile: false
            };
          }
          
          if (file.file) {
            const result = await window.electronAPI.uploadFile(file.file);
            if (result?.success) {
              return {
                id: uuidv4(),
                name: file.name,
                path: result.path,
                type: file.type,
                size: file.size,
                isProjectFile: false
              };
            }
          }
          return null;
        })
      );

      const validAttachments = messageAttachments.filter(a => a !== null);
      
      // Создаем сообщение пользователя
      const userMessage = {
        id: uuidv4(),
        chatId: currentChat.id,
        content: messageContent,
        role: 'user',
        timestamp: new Date().toISOString(),
        attachments: validAttachments
      };
      
      // Немедленно добавляем в UI
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: userMessage });
      
      // Сохраняем в БД
      await window.electronAPI.createMessage(userMessage);
      
      // Подготавливаем все файлы для API
      const allAttachmentsForAPI = [...validAttachments];
      if (projectFiles?.length > 0) {
        projectFiles.forEach(pf => {
          allAttachmentsForAPI.push({
            ...pf,
            isProjectFile: true
          });
        });
      }
      
      // Отправляем в Claude API
      const claudeResponse = await window.electronAPI.sendToClaudeAI({
      content: content,
      attachments: allAttachmentsForAPI,
      history: state.messages
      });
      
      if (claudeResponse?.error) {
        throw new Error(claudeResponse.error);
      }
      
      // Создаем ответное сообщение
      const assistantMessage = {
        id: uuidv4(),
        chatId: currentChat.id,
        content: claudeResponse.content,
        role: 'assistant',
        timestamp: new Date().toISOString(),
      };
      
      // Добавляем в UI
      dispatch({ type: ActionTypes.ADD_MESSAGE, payload: assistantMessage });
      
      // Сохраняем в БД
      await window.electronAPI.createMessage(assistantMessage);
      
      // Обновляем метаданные чата
      await updateChat(currentChat.id, {
        updated_at: new Date().toISOString()
      });
      
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      return { userMessage, assistantMessage };
    } catch (error) {
      console.error('Error sending message:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.activeChat, state.messages, createChat, updateChat]);

  // Регенерация ответа
  const regenerateLastResponse = useCallback(async () => {
    try {
      const messages = [...state.messages];
      let lastUserMessageIndex = -1;
      
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMessageIndex = i;
          break;
        }
      }
      
      if (lastUserMessageIndex === -1) {
        throw new Error('Не найдено сообщение пользователя');
      }
      
      const userMessage = messages[lastUserMessageIndex];
      const newMessages = messages.filter((msg, idx) => 
        idx <= lastUserMessageIndex || msg.role !== 'assistant'
      );
      
      dispatch({ type: ActionTypes.SET_MESSAGES, payload: newMessages });
      
      return await sendMessage(userMessage.content, userMessage.attachments || []);
    } catch (error) {
      console.error('Error regenerating response:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.messages, sendMessage]);

  // Экспорт чата
  const exportChat = useCallback(async (chatId, format = 'markdown') => {
    try {
      if (!window.electronAPI) throw new Error('API недоступен');
      
      const savePath = await window.electronAPI.saveFileDialog(
        `chat-export-${new Date().toISOString().split('T')[0]}.${format === 'markdown' ? 'md' : format}`,
        [{ name: format.toUpperCase(), extensions: [format === 'markdown' ? 'md' : format] }]
      );
      
      if (!savePath?.filePath) return null;
      
      const result = await window.electronAPI.exportChat(chatId, format, {
        includeArtifacts: true
      });
      
      if (!result?.success) {
        throw new Error(result?.error || 'Ошибка экспорта');
      }
      
      return savePath.filePath;
    } catch (error) {
      console.error('Error exporting chat:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Очистка ошибки
  const setError = useCallback((error) => {
    if (error) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: error });
    } else {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
    }
  }, []);

  // Мемоизированное значение контекста
  const value = useMemo(() => ({
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
  }), [
    state.activeChat,
    state.messages, 
    state.chats,
    state.isLoading,
    state.error,
    createChat,
    updateChat,
    deleteChat,
    loadChat,
    sendMessage,
    regenerateLastResponse,
    exportChat,
    setError
  ]);

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