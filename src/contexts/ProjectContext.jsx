import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Initial state
const initialState = {
  projects: [],
  activeProject: null,
  files: [],
  isLoading: false,
  error: null,
};

// Action types
const ActionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_PROJECTS: 'SET_PROJECTS',
  SET_ACTIVE_PROJECT: 'SET_ACTIVE_PROJECT',
  SET_FILES: 'SET_FILES',
  ADD_FILE: 'ADD_FILE',
  UPDATE_FILE: 'UPDATE_FILE',
  DELETE_FILE: 'DELETE_FILE',
  CREATE_PROJECT: 'CREATE_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  DELETE_PROJECT: 'DELETE_PROJECT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  CLEAR_FILES: 'CLEAR_FILES',
};

// Оптимизированный reducer
const projectReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };
    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };
    case ActionTypes.SET_PROJECTS:
      return { ...state, projects: action.payload, isLoading: false };
    case ActionTypes.SET_ACTIVE_PROJECT:
      return { ...state, activeProject: action.payload, isLoading: false };
    case ActionTypes.SET_FILES:
      return { ...state, files: action.payload, isLoading: false };
    case ActionTypes.CLEAR_FILES:
      return { ...state, files: [], isLoading: false };
    case ActionTypes.ADD_FILE:
      return { ...state, files: [...state.files, action.payload], isLoading: false };
    case ActionTypes.UPDATE_FILE:
      return {
        ...state,
        files: state.files.map(file =>
          file.id === action.payload.id ? { ...file, ...action.payload } : file
        ),
        isLoading: false,
      };
    case ActionTypes.DELETE_FILE:
      return {
        ...state,
        files: state.files.filter(file => file.id !== action.payload),
        isLoading: false,
      };
    case ActionTypes.CREATE_PROJECT:
      return {
        ...state,
        projects: [...state.projects, action.payload],
        activeProject: action.payload,
        files: [], // Новый проект = пустые файлы
        isLoading: false,
      };
    case ActionTypes.UPDATE_PROJECT:
      return {
        ...state,
        projects: state.projects.map(project =>
          project.id === action.payload.id ? { ...project, ...action.payload } : project
        ),
        activeProject: state.activeProject?.id === action.payload.id
          ? { ...state.activeProject, ...action.payload }
          : state.activeProject,
        isLoading: false,
      };
    case ActionTypes.DELETE_PROJECT:
      return {
        ...state,
        projects: state.projects.filter(project => project.id !== action.payload),
        activeProject: state.activeProject?.id === action.payload ? null : state.activeProject,
        files: state.activeProject?.id === action.payload ? [] : state.files,
        isLoading: false,
      };
    default:
      return state;
  }
};

// Create context
const ProjectContext = createContext();

// Provider component
export const ProjectProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectReducer, initialState);

  // ИСПРАВЛЕНО: убираем агрессивное кеширование файлов
  const projectsLoadedRef = React.useRef(false);
  const currentProjectIdRef = React.useRef(null);

  // ИСПРАВЛЕНО: загрузка файлов без кеширования
  const loadFiles = useCallback(async (projectId, force = false) => {
    if (!projectId) {
      dispatch({ type: ActionTypes.CLEAR_FILES });
      currentProjectIdRef.current = null;
      return;
    }
    
    // ИСПРАВЛЕНО: всегда загружаем файлы при смене проекта
    if (!force && currentProjectIdRef.current === projectId) {
      return; // Загружаем только если это другой проект
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      console.log('ProjectContext: загружаем файлы для проекта:', projectId);
      const files = await window.electronAPI.getProjectFiles(projectId);
      console.log('ProjectContext: получено файлов:', files?.length || 0);
      
      dispatch({ type: ActionTypes.SET_FILES, payload: files || [] });
      currentProjectIdRef.current = projectId;
    } catch (error) {
      console.error('Error loading project files:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // ИСПРАВЛЕНО: упрощенная загрузка проектов без файлов
  const loadProjects = useCallback(async () => {
    if (projectsLoadedRef.current) return;
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!window.electronAPI) {
          throw new Error('API недоступен');
        }
      }
      
      console.log('ProjectContext: загружаем список проектов');
      const projects = await window.electronAPI.getProjects();
      
      // ИСПРАВЛЕНО: не загружаем файлы сразу для всех проектов
      // Файлы будут загружены только при выборе конкретного проекта
      const projectsWithoutFiles = (projects || []).map(project => ({
        ...project,
        files: [] // Не загружаем файлы заранее
      }));
      
      dispatch({ type: ActionTypes.SET_PROJECTS, payload: projectsWithoutFiles });
      projectsLoadedRef.current = true;
      
      console.log('ProjectContext: загружено проектов:', projectsWithoutFiles.length);
    } catch (error) {
      console.error('Error loading projects:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // Загружаем проекты только при монтировании
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // ИСПРАВЛЕНО: правильная установка активного проекта
  const setActiveProject = useCallback((project) => {
    console.log('ProjectContext: устанавливаем активный проект:', project?.name || project?.title);
    
    dispatch({ type: ActionTypes.SET_ACTIVE_PROJECT, payload: project });
    
    // ИСПРАВЛЕНО: принудительно загружаем файлы для нового активного проекта
    if (project?.id) {
      loadFiles(project.id, true);
    } else {
      dispatch({ type: ActionTypes.CLEAR_FILES });
      currentProjectIdRef.current = null;
    }
  }, [loadFiles]);

  // Оптимизированное создание проекта
  const createProject = useCallback(async (name, description = '') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      const newProject = {
        id: uuidv4(),
        name,
        title: name, // Для совместимости
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: []
      };
      
      console.log('ProjectContext: создаем проект:', newProject.name);
      
      // Сохраняем в БД
      const result = await window.electronAPI.createProject(newProject);
      if (!result?.success) {
        throw new Error(result?.error || 'Ошибка создания проекта');
      }
      
      // Оптимистично добавляем в UI
      dispatch({ type: ActionTypes.CREATE_PROJECT, payload: newProject });
      currentProjectIdRef.current = newProject.id;
      
      console.log('ProjectContext: проект создан успешно');
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Оптимизированное обновление проекта
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      const project = state.projects.find(p => p.id === projectId);
      if (!project) throw new Error('Project not found');
      
      const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('ProjectContext: обновляем проект:', updatedProject.name || updatedProject.title);
      
      // Оптимистично обновляем UI
      dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: updatedProject });
      
      // Затем сохраняем в БД
      if (window.electronAPI) {
        await window.electronAPI.updateProject(updatedProject);
      }
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.projects]);

  // Оптимизированное удаление проекта
  const deleteProject = useCallback(async (projectId) => {
    try {
      console.log('ProjectContext: удаляем проект:', projectId);
      
      // Оптимистично удаляем из UI
      dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId });
      
      // Если удаляем текущий проект, очищаем ссылки
      if (currentProjectIdRef.current === projectId) {
        currentProjectIdRef.current = null;
      }
      
      // Затем удаляем из БД
      if (window.electronAPI) {
        await window.electronAPI.deleteProject(projectId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return true; // Возвращаем true для UI
    }
  }, []);

  // Оптимизированное добавление файла
  const addFile = useCallback(async (file, description = '') => {
    if (!state.activeProject) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'No active project selected' });
      return null;
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      console.log('ProjectContext: добавляем файл:', file.name, 'в проект:', state.activeProject.name);
      
      // Загружаем файл
      const uploadedFile = await window.electronAPI.uploadFile(file);
      if (!uploadedFile?.success) {
        throw new Error(uploadedFile?.error || 'Error uploading file');
      }
      
      const newFile = {
        id: uuidv4(),
        projectId: state.activeProject.id,
        name: file.name,
        description,
        path: uploadedFile.path,
        type: file.type,
        size: file.size,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Оптимистично добавляем в UI
      dispatch({ type: ActionTypes.ADD_FILE, payload: newFile });
      
      // Сохраняем в БД
      await window.electronAPI.createProjectFile(newFile);
      
      // Обновляем проект
      const updatedProject = {
        ...state.activeProject,
        updatedAt: new Date().toISOString(),
      };
      
      dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: updatedProject });
      
      if (window.electronAPI) {
        await window.electronAPI.updateProject(updatedProject);
      }
      
      console.log('ProjectContext: файл добавлен успешно');
      return newFile;
    } catch (error) {
      console.error('Error adding file:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.activeProject]);

  // Оптимизированное обновление файла
  const updateFile = useCallback(async (fileId, updates) => {
    try {
      const file = state.files.find(f => f.id === fileId);
      if (!file) throw new Error('File not found');
      
      const updatedFile = {
        ...file,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('ProjectContext: обновляем файл:', updatedFile.name);
      
      // Оптимистично обновляем UI
      dispatch({ type: ActionTypes.UPDATE_FILE, payload: updatedFile });
      
      // Затем сохраняем в БД
      if (window.electronAPI) {
        await window.electronAPI.updateProjectFile(updatedFile);
      }
      
      return updatedFile;
    } catch (error) {
      console.error('Error updating file:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.files]);

  // Оптимизированное удаление файла
  const deleteFile = useCallback(async (fileId) => {
    try {
      const file = state.files.find(f => f.id === fileId);
      console.log('ProjectContext: удаляем файл:', file?.name);
      
      // Оптимистично удаляем из UI
      dispatch({ type: ActionTypes.DELETE_FILE, payload: fileId });
      
      // Удаляем файл из хранилища и БД
      if (window.electronAPI) {
        if (file?.path) {
          await window.electronAPI.deleteFile(file.path).catch(console.error);
        }
        await window.electronAPI.deleteProjectFile(fileId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return true; // Возвращаем true для UI
    }
  }, [state.files]);

  // Очистка ошибки
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // ИСПРАВЛЕНО: добавляем метод для получения проекта с файлами
  const getProjectWithFiles = useCallback(async (projectId) => {
    try {
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      // Ищем проект в списке
      let project = state.projects.find(p => p.id === projectId);
      
      if (!project) {
        // Если проект не найден, перезагружаем список
        await loadProjects();
        project = state.projects.find(p => p.id === projectId);
      }
      
      if (project) {
        // Загружаем файлы для проекта
        const files = await window.electronAPI.getProjectFiles(projectId);
        return {
          ...project,
          files: files || []
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting project with files:', error);
      return null;
    }
  }, [state.projects, loadProjects]);

  // Мемоизированное значение контекста
  const value = useMemo(() => ({
    ...state,
    createProject,
    updateProject,
    setActiveProject,
    deleteProject,
    addFile,
    updateFile,
    deleteFile,
    clearError,
    loadFiles,
    getProjectWithFiles,
  }), [
    state,
    createProject,
    updateProject,
    setActiveProject,
    deleteProject,
    addFile,
    updateFile,
    deleteFile,
    clearError,
    loadFiles,
    getProjectWithFiles
  ]);

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};

// Hook for using project context
export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectContext;