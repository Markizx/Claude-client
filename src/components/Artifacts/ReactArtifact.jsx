import React, { useState, useCallback, useMemo } from 'react';
import { Box, Typography, Alert, IconButton, Tooltip, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import RefreshIcon from '@mui/icons-material/Refresh';

const ReactArtifact = ({ content }) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [renderedComponent, setRenderedComponent] = useState(null);

  // Создание компонента из строки кода
  const createComponent = useCallback((code) => {
    try {
      // Базовая проверка безопасности
      const dangerousPatterns = [
        'eval(',
        'Function(',
        'setTimeout(',
        'setInterval(',
        'document.cookie',
        'localStorage',
        'sessionStorage',
        'window.location',
        'XMLHttpRequest',
        'fetch(',
        'import(',
        'require(',
        '__dirname',
        '__filename',
        'process.',
        'global.',
        'Buffer.',
        'crypto.'
      ];

      const hasDangerousCode = dangerousPatterns.some(pattern => 
        code.includes(pattern)
      );

      if (hasDangerousCode) {
        throw new Error('Код содержит потенциально опасные конструкции и не может быть выполнен');
      }

      // Создаем функцию для выполнения кода в изолированной среде
      const createComponentFunction = () => {
        // Доступные хуки и React API
        const { useState, useEffect, useMemo, useCallback, useRef } = React;
        
        // Выполняем код в контексте с ограниченными возможностями
        try {
          // eslint-disable-next-line no-new-func
          const componentFunc = new Function(
            'React',
            'useState',
            'useEffect', 
            'useMemo',
            'useCallback',
            'useRef',
            `
            ${code}
            
            // Если код экспортирует компонент, возвращаем его
            if (typeof module !== 'undefined' && module.exports) {
              return module.exports;
            }
            
            // Ищем экспорт по умолчанию
            if (typeof exports !== 'undefined') {
              return exports.default || exports;
            }
            
            // Пытаемся найти функцию компонента в коде
            const matches = code.match(/(?:function|const|let|var)\\s+([A-Z][a-zA-Z0-9]*)\\s*\\(/);
            if (matches && typeof window[matches[1]] === 'function') {
              return window[matches[1]];
            }
            
            // Ищем JSX элемент
            const jsxMatch = code.match(/<[A-Z][a-zA-Z0-9]*|<div|<span|<p|<h[1-6]|<button|<input/);
            if (jsxMatch) {
              // Пытаемся обернуть код в компонент
              return () => { ${code} };
            }
            
            return null;
            `
          );
          
          return componentFunc(React, useState, useEffect, useMemo, useCallback, useRef);
        } catch (syntaxError) {
          // Если прямое выполнение не сработало, пытаемся обернуть в компонент
          try {
            const wrappedCode = `
              function GeneratedComponent() {
                ${code}
              }
              return GeneratedComponent;
            `;
            
            // eslint-disable-next-line no-new-func
            const wrappedFunc = new Function(
              'React',
              'useState',
              'useEffect',
              'useMemo', 
              'useCallback',
              'useRef',
              wrappedCode
            );
            
            return wrappedFunc(React, useState, useEffect, useMemo, useCallback, useRef);
          } catch (wrapError) {
            throw new Error(`Не удалось создать компонент: ${syntaxError.message}`);
          }
        }
      };

      return createComponentFunction();
    } catch (err) {
      throw new Error(`Ошибка создания компонента: ${err.message}`);
    }
  }, []);

  const executeCode = useCallback(() => {
    try {
      setError(null);
      
      const Component = createComponent(content);
      
      if (!Component) {
        throw new Error('Не удалось создать компонент из предоставленного кода');
      }

      // Проверяем, является ли Component валидным React компонентом
      if (typeof Component !== 'function' && !React.isValidElement(Component)) {
        throw new Error('Предоставленный код не является валидным React компонентом');
      }

      // Создаем элемент React в безопасной среде
      try {
        const element = typeof Component === 'function' 
          ? React.createElement(Component) 
          : Component;
        
        setRenderedComponent(element);
        setIsExecuting(true);
      } catch (renderError) {
        throw new Error(`Ошибка создания элемента: ${renderError.message}`);
      }
    } catch (err) {
      console.error('Ошибка выполнения React кода:', err);
      setError(err.message);
      setIsExecuting(false);
    }
  }, [content, createComponent]);

  const stopExecution = useCallback(() => {
    setRenderedComponent(null);
    setIsExecuting(false);
    setError(null);
  }, []);

  // Проверка валидности кода при изменении
  const codeValidation = useMemo(() => {
    if (!content) return { isValid: false, message: 'Нет кода для выполнения' };
    
    // Базовые проверки
    if (content.trim().length < 10) {
      return { isValid: false, message: 'Код слишком короткий' };
    }

    // Проверка на наличие JSX или React элементов
    const hasJSX = content.includes('<') && content.includes('>');
    const hasReact = content.includes('React') || content.includes('useState') || content.includes('useEffect');
    const hasFunction = content.includes('function') || content.includes('=>') || content.includes('const ');
    
    if (!hasJSX && !hasReact && !hasFunction) {
      return { isValid: false, message: 'Код не содержит React компоненты, JSX или функции' };
    }

    return { isValid: true, message: '' };
  }, [content]);

  // Ошибка компонента для перехвата ошибок рендеринга
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
      console.error('ErrorBoundary перехватил ошибку:', error, errorInfo);
    }

    render() {
      if (this.state.hasError) {
        return (
          <Alert severity="error">
            Ошибка рендеринга компонента: {this.state.error?.message || 'Неизвестная ошибка'}
          </Alert>
        );
      }

      return this.props.children;
    }
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="subtitle2" color="text.secondary">
          React компонент
        </Typography>
        <Box>
          {!isExecuting ? (
            <Tooltip title={codeValidation.isValid ? "Выполнить компонент" : codeValidation.message}>
              <span>
                <IconButton 
                  onClick={executeCode} 
                  color="primary" 
                  size="small"
                  disabled={!codeValidation.isValid}
                >
                  <PlayArrowIcon />
                </IconButton>
              </span>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Обновить">
                <IconButton onClick={executeCode} color="primary" size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Остановить">
                <IconButton onClick={stopExecution} color="error" size="small">
                  <StopIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Ошибка выполнения: {error}
        </Alert>
      )}

      {!codeValidation.isValid && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {codeValidation.message}
        </Alert>
      )}

      {isExecuting && renderedComponent ? (
        <Paper 
          variant="outlined"
          sx={{ 
            p: 2, 
            mb: 2,
            minHeight: 100,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Результат выполнения:
          </Typography>
          <Box 
            sx={{ 
              '& > *': { margin: 0 },
              '& img': { maxWidth: '100%', height: 'auto' },
              minHeight: 50
            }}
          >
            <ErrorBoundary>
              <React.Suspense fallback={<Typography>Загрузка компонента...</Typography>}>
                {renderedComponent}
              </React.Suspense>
            </ErrorBoundary>
          </Box>
        </Paper>
      ) : !error && codeValidation.isValid && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Нажмите ▶️ для выполнения React компонента
        </Alert>
      )}

      <Paper 
        variant="outlined"
        sx={{ 
          bgcolor: 'grey.50',
          p: 2,
          borderRadius: 1
        }}
      >
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Исходный код:
        </Typography>
        <Box 
          component="pre"
          sx={{ 
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
            fontSize: '0.875rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            m: 0,
            overflow: 'auto',
            maxHeight: 300
          }}
        >
          {content}
        </Box>
      </Paper>
    </Box>
  );
};

export default ReactArtifact;