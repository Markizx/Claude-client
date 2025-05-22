import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
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

// Reducer for state management
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

  // ИСПРАВЛЕНО: Добавляем функцию loadFiles
  const loadFiles = useCallback(async (projectId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке файлов проекта');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      console.log('ProjectContext: загружаем файлы для проекта:', projectId);
      const files = await window.electronAPI.getProjectFiles(projectId);
      console.log('ProjectContext: получено файлов проекта:', files?.length || 0);
      
      dispatch({ type: ActionTypes.SET_FILES, payload: files || [] });
    } catch (error) {
      console.error('Error loading project files:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  }, []);

  // Load projects on mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load files when active project changes
  useEffect(() => {
    if (state.activeProject && state.activeProject.id) {
      console.log('ProjectContext: активный проект изменился, загружаем файлы:', state.activeProject.id);
      loadFiles(state.activeProject.id);
    } else {
      // Если нет активного проекта, очищаем файлы
      dispatch({ type: ActionTypes.SET_FILES, payload: [] });
    }
  }, [state.activeProject, loadFiles]);

  // Load all projects
  const loadProjects = async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при загрузке проектов');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return;
      }
      
      console.log('ProjectContext: загружаем проекты...');
      const projects = await window.electronAPI.getProjects();
      console.log('ProjectContext: получено проектов:', projects?.length || 0);
      
      if (projects && projects.length > 0) {
        // ДОБАВЛЕНО: для каждого проекта загружаем его файлы
        const projectsWithFiles = await Promise.all(
          projects.map(async (project) => {
            try {
              console.log(`ProjectContext: загружаем файлы для проекта ${project.name}...`);
              const files = await window.electronAPI.getProjectFiles(project.id);
              console.log(`ProjectContext: получено файлов для ${project.name}:`, files?.length || 0);
              
              return {
                ...project,
                files: files || []
              };
            } catch (error) {
              console.error(`Ошибка загрузки файлов для проекта ${project.name}:`, error);
              return {
                ...project,
                files: []
              };
            }
          })
        );
        
        console.log('ProjectContext: проекты с файлами:', projectsWithFiles);
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: projectsWithFiles });
      } else {
        dispatch({ type: ActionTypes.SET_PROJECTS, payload: [] });
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
    }
  };

  // Create a new project
  const createProject = useCallback(async (name, description = '') => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при создании проекта');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const newProject = {
        id: uuidv4(),
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        files: [] // ИСПРАВЛЕНО: добавляем пустой массив файлов
      };
      
      console.log('ProjectContext: создаем новый проект:', newProject);
      
      const result = await window.electronAPI.createProject(newProject);
      
      if (!result || !result.success) {
        console.error('API error creating project:', result?.error);
      }
      
      dispatch({ type: ActionTypes.CREATE_PROJECT, payload: newProject });
      
      return newProject;
    } catch (error) {
      console.error('Error creating project:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, []);

  // Update a project
  const updateProject = useCallback(async (projectId, updates) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при обновлении проекта');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const project = state.projects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const updatedProject = {
        ...project,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('ProjectContext: обновляем проект:', updatedProject);
      
      const result = await window.electronAPI.updateProject(updatedProject);
      
      if (!result || !result.success) {
        console.error('API error updating project:', result?.error);
      }
      
      dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: updatedProject });
      
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    }
  }, [state.projects]);

  // Set active project
  const setActiveProject = useCallback((project) => {
    console.log('ProjectContext: устанавливаем активный проект:', project?.id);
    dispatch({ type: ActionTypes.SET_ACTIVE_PROJECT, payload: project });
  }, []);

  // Delete a project
  const deleteProject = useCallback(async (projectId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при удалении проекта');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return false;
      }
      
      console.log('ProjectContext: удаляем проект:', projectId);
      
      const result = await window.electronAPI.deleteProject(projectId);
      
      // Удаляем проект из состояния даже если API вернул ошибку
      dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId });
      
      if (!result || !result.success) {
        console.error('API error deleting project:', result?.error);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      
      // Все равно удаляем из локального состояния
      dispatch({ type: ActionTypes.DELETE_PROJECT, payload: projectId });
      
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return true; // Возвращаем true, чтобы UI показал что проект удален
    }
  }, []);

  // Add a file to a project
  const addFile = useCallback(async (file, description = '') => {
    if (!state.activeProject) {
      dispatch({ type: ActionTypes.SET_ERROR, payload: 'No active project selected' });
      return null;
    }
    
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при добавлении файла');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      console.log('ProjectContext: добавляем файл к проекту:', state.activeProject.id);
      
      // Upload the file
      const uploadedFile = await window.electronAPI.uploadFile(file);
      
      if (!uploadedFile || !uploadedFile.success) {
        throw new Error(uploadedFile?.error || 'Error uploading file');
      }
      
      // Create file metadata
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
      
      console.log('ProjectContext: создаем метаданные файла:', newFile);
      
      // Save file metadata to database
      const result = await window.electronAPI.createProjectFile(newFile);
      
      if (!result || !result.success) {
        console.error('API error creating project file:', result?.error);
      }
      
      dispatch({ type: ActionTypes.ADD_FILE, payload: newFile });
      
      // Update project metadata
      const updatedProject = {
        ...state.activeProject,
        updatedAt: new Date().toISOString(),
      };
      
      const updateResult = await window.electronAPI.updateProject(updatedProject);
      
      if (!updateResult || !updateResult.success) {
        console.error('API error updating project after adding file:', updateResult?.error);
      }
      
      dispatch({ type: ActionTypes.UPDATE_PROJECT, payload: updatedProject });
      
      console.log('ProjectContext: файл успешно добавлен к проекту');
      
      return newFile;
    } catch (error) {
      console.error('Error adding file:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.activeProject]);

  // Update a file
  const updateFile = useCallback(async (fileId, updates) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при обновлении файла');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return null;
      }
      
      const file = state.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }
      
      const updatedFile = {
        ...file,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      console.log('ProjectContext: обновляем файл:', updatedFile);
      
      const result = await window.electronAPI.updateProjectFile(updatedFile);
      
      if (!result || !result.success) {
        console.error('API error updating project file:', result?.error);
      }
      
      dispatch({ type: ActionTypes.UPDATE_FILE, payload: updatedFile });
      
      return updatedFile;
    } catch (error) {
      console.error('Error updating file:', error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return null;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.files]);

  // Delete a file
  const deleteFile = useCallback(async (fileId) => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      
      // Проверяем доступность electronAPI
      if (!window.electronAPI) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      if (!window.electronAPI) {
        console.error('electronAPI не доступен при удалении файла');
        dispatch({ type: ActionTypes.SET_ERROR, payload: 'API не доступен' });
        return false;
      }
      
      const file = state.files.find(f => f.id === fileId);
      if (!file) {
        throw new Error('File not found');
      }
      
      console.log('ProjectContext: удаляем файл:', fileId);
      
      // Delete file from storage
      if (file.path) {
        await window.electronAPI.deleteFile(file.path).catch(err => {
          console.error(`Error deleting file from storage: ${err.message}`);
        });
      }
      
      // Delete file metadata from database
      const result = await window.electronAPI.deleteProjectFile(fileId);
      
      // Удаляем файл из состояния
      dispatch({ type: ActionTypes.DELETE_FILE, payload: fileId });
      
      if (!result || !result.success) {
        console.error('API error deleting project file:', result?.error);
      }
      
      console.log('ProjectContext: файл успешно удален');
      
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      
      // Удаляем из локального состояния в любом случае
      if (fileId) {
        dispatch({ type: ActionTypes.DELETE_FILE, payload: fileId });
      }
      
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      return true; // Возвращаем true, чтобы UI показал что файл удален
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.files]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // Context value
  const value = {
    ...state,
    createProject,
    updateProject,
    setActiveProject,
    deleteProject,
    addFile,
    updateFile,
    deleteFile,
    clearError,
    loadFiles, // ИСПРАВЛЕНО: экспортируем функцию loadFiles
  };

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