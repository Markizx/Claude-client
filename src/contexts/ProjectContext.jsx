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

  // Кеши для предотвращения повторных загрузок
  const loadedProjects = useMemo(() => new Set(), []);
  const loadedFiles = useMemo(() => new Map(), []);

  // Оптимизированная загрузка файлов с кешированием
  const loadFiles = useCallback(async (projectId) => {
    if (!projectId || loadedFiles.has(projectId)) return;
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        throw new Error('API недоступен');
      }
      
      const files = await window.electronAPI.getProjectFiles(projectId);
      dispatch({ type: ActionTypes.SET_FILES, payload: files || [] });
      loadedFiles.set(projectId, true);
    } catch (error) {
      console.error('Error loading project files:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, [loadedFiles]);

  // Оптимизированная загрузка проектов с файлами
  const loadProjects = useCallback(async () => {
    if (loadedProjects.has('projects')) return;
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!window.electronAPI) {
          throw new Error('API недоступен');
        }
      }
      
      const projects = await window.electronAPI.getProjects();
      
      if (projects?.length > 0) {
        // Загружаем файлы параллельно для всех проектов
        const projectsWithFiles = await Promise.allSettled(
          projects.map(async (project) => {
            try {
              const files = await window.electronAPI.getProjectFiles(project.id);
              loadedFiles.set(project.id, true);
              return { ...project, files: files || [] };
            } catch (error) {
              console.error(`Error loading files for project ${project.name}:`, error);
              return { ...project, files: [] };
            }
          })
        );
        
        const successfulProjects = projectsWithFiles
          .filter(result => result.status === 'fulfilled')
          .map(result => result.value);
        
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: successfulProjects });
      } else {
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: [] });
      }
      
      loadedProjects.add('projects');
    } catch (error) {
      console.error('Error loading projects:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, [loadedProjects, loadedFiles]);

  // Загружаем проекты только при монтировании
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Загружаем файлы при изменении активного проекта
  useEffect(() => {
    if (state.activeProject?.id) {
      loadFiles(state.activeProject.id);
    } else {
      dispatch({ type: ActionTypes.SET_FILES, payload: [] });
    }
  }, [state.activeProject?.id, loadFiles]);

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
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: []
      };
      
      // Оптимистично добавляем в UI
      dispatch({ type: ActionTypes.CREATE_PROJECT, payload: newProject });
      loadedFiles.set(newProject.id, true);
      
      // Затем сохраняем в БД
      await window.electronAPI.createProject(newProject);
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [loadedFiles]);

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

  // Установка активного проекта
  const setActiveProject = useCallback((project) => {
    dispatch({ type: ActionTypes.SET_ACTIVE_PROJECT, payload: project });
  }, []);

  // Оптимизированное удаление проекта
  const deleteProject = useCallback(async (projectId) => {
    try {
      // Оптимистично удаляем из UI
      dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId });
      loadedFiles.delete(projectId);
      
      // Затем удаляем из БД
      if (window.electronAPI) {
        await window.electronAPI.deleteProject(projectId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return true; // Возвращаем true для UI
    }
  }, [loadedFiles]);

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
    loadFiles
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