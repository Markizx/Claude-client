// components/Artifacts/CodeArtifact.jsx
import React, { useState } from 'react';
import { Box, Typography, IconButton, Tooltip, Chip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useDynamicTheme } from '../../contexts/DynamicThemeProvider';

const CodeArtifact = ({ content, language = 'text', title }) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const { isDark } = useDynamicTheme();

  if (!content) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Нет содержимого
        </Typography>
      </Box>
    );
  }

  // Маппинг языков для SyntaxHighlighter
  const getLanguageName = (lang) => {
    if (!lang) return 'text';
    
    const langMap = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'md': 'markdown',
      'yml': 'yaml',
      'sh': 'bash',
      'cmd': 'bash',
      'ps1': 'powershell'
    };
    
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Показываем уведомление
      const event = new CustomEvent('show-notification', {
        detail: { message: 'Код скопирован в буфер обмена', type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
  };

  const getLanguageDisplayName = (lang) => {
    const displayNames = {
      'javascript': 'JavaScript',
      'typescript': 'TypeScript',
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'yaml': 'YAML',
      'xml': 'XML',
      'sql': 'SQL',
      'bash': 'Bash',
      'powershell': 'PowerShell',
      'php': 'PHP',
      'ruby': 'Ruby',
      'go': 'Go',
      'rust': 'Rust',
      'swift': 'Swift',
      'kotlin': 'Kotlin',
      'scala': 'Scala',
      'markdown': 'Markdown'
    };
    
    return displayNames[lang] || lang.toUpperCase();
  };

  const style = isDark ? oneDark : oneLight;
  const languageName = getLanguageName(language);
  const displayLanguage = getLanguageDisplayName(languageName);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Заголовок с языком и кнопкой копирования */}
      {(language || title) && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          px: 3,
          py: 1.5,
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {language && (
              <Chip
                label={displayLanguage}
                size="small"
                variant="outlined"
                sx={{ 
                  fontSize: '0.75rem',
                  height: 24,
                  fontWeight: 500,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}
            {title && (
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              >
                {title}
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {copySuccess && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'success.main',
                  fontWeight: 500,
                  fontSize: '0.75rem'
                }}
              >
                Скопировано!
              </Typography>
            )}
            <Tooltip title="Копировать код">
              <IconButton 
                size="small" 
                onClick={handleCopy}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { 
                    color: 'primary.main',
                    bgcolor: 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Код с подсветкой синтаксиса */}
      <Box sx={{ 
        '& pre': { 
          margin: '0 !important',
          background: 'transparent !important',
          padding: '20px !important',
          fontSize: '14px !important',
          lineHeight: '1.6 !important',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace !important'
        },
        '& code': {
          background: 'transparent !important',
          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace !important'
        },
        bgcolor: isDark ? '#1e1e1e' : '#fafafa',
        overflow: 'auto',
        maxHeight: '500px',
        '&::-webkit-scrollbar': { width: 6, height: 6 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { 
          bgcolor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', 
          borderRadius: 3,
          '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }
        }
      }}>
        <SyntaxHighlighter
          language={languageName}
          style={style}
          showLineNumbers={content.split('\n').length > 10}
          wrapLines={true}
          customStyle={{
            background: 'transparent',
            padding: 0,
            margin: 0,
            fontSize: '14px',
            lineHeight: '1.6'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, "Courier New", monospace'
            }
          }}
          lineNumberStyle={{
            minWidth: '3em',
            paddingRight: '1em',
            textAlign: 'right',
            userSelect: 'none',
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
          }}
        >
          {content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

export default CodeArtifact;