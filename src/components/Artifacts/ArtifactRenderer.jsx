// components/Artifacts/ArtifactRenderer.jsx
import React, { useState, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Tooltip, 
  Chip,
  Divider,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Collapse
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CodeIcon from '@mui/icons-material/Code';
import DescriptionIcon from '@mui/icons-material/Description';
import BrushIcon from '@mui/icons-material/Brush';
import WebIcon from '@mui/icons-material/Web';
import ImageIcon from '@mui/icons-material/Image';
import CodeArtifact from './CodeArtifact';
import MarkdownArtifact from './MarkdownArtifact';
import ReactArtifact from './ReactArtifact';
import SVGArtifact from './SVGArtifact';

const ArtifactRenderer = ({ artifact }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const artifactRef = useRef(null);

  if (!artifact) return null;

  // Получение иконки и цвета для типа артефакта
  const getTypeInfo = (type) => {
    switch (type) {
      case 'application/vnd.ant.code':
        return { 
          icon: <CodeIcon fontSize="small" />, 
          color: '#10b981', 
          label: 'Код',
          bgColor: 'rgba(16, 185, 129, 0.1)'
        };
      case 'text/markdown':
        return { 
          icon: <DescriptionIcon fontSize="small" />, 
          color: '#3b82f6', 
          label: 'Документ',
          bgColor: 'rgba(59, 130, 246, 0.1)'
        };
      case 'application/vnd.ant.react':
        return { 
          icon: <BrushIcon fontSize="small" />, 
          color: '#06b6d4', 
          label: 'React',
          bgColor: 'rgba(6, 182, 212, 0.1)'
        };
      case 'image/svg+xml':
        return { 
          icon: <ImageIcon fontSize="small" />, 
          color: '#8b5cf6', 
          label: 'SVG',
          bgColor: 'rgba(139, 92, 246, 0.1)'
        };
      case 'text/html':
        return { 
          icon: <WebIcon fontSize="small" />, 
          color: '#f59e0b', 
          label: 'HTML',
          bgColor: 'rgba(245, 158, 11, 0.1)'
        };
      default:
        return { 
          icon: <DescriptionIcon fontSize="small" />, 
          color: '#6b7280', 
          label: 'Файл',
          bgColor: 'rgba(107, 114, 128, 0.1)'
        };
    }
  };

  const typeInfo = getTypeInfo(artifact.type);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content || '');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      
      // Показываем уведомление
      const event = new CustomEvent('show-notification', {
        detail: { message: 'Содержимое скопировано в буфер обмена', type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Ошибка при копировании:', error);
    }
    handleMenuClose();
  };

  const handleDownload = async () => {
    try {
      const blob = new Blob([artifact.content || ''], { 
        type: getDownloadMimeType(artifact.type) 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = getDownloadFileName(artifact);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Артефакт скачан:', artifact.title);
    } catch (error) {
      console.error('Ошибка при скачивании артефакта:', error);
    }
    handleMenuClose();
  };

  const handleOpenInNew = () => {
    // Для React компонентов и HTML - открываем в новом окне
    if (artifact.type === 'application/vnd.ant.react' || artifact.type === 'text/html') {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${artifact.title || 'Артефакт'}</title>
              <style>
                body { 
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  margin: 0; 
                  padding: 20px; 
                  line-height: 1.6;
                }
                pre { 
                  background: #f5f5f5; 
                  padding: 15px; 
                  border-radius: 8px; 
                  overflow: auto;
                }
              </style>
            </head>
            <body>
              ${artifact.type === 'text/html' ? artifact.content : `<pre><code>${artifact.content}</code></pre>`}
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
    handleMenuClose();
  };

  const getDownloadMimeType = (type) => {
    switch (type) {
      case 'application/vnd.ant.code':
        return 'text/plain';
      case 'text/markdown':
        return 'text/markdown';
      case 'application/vnd.ant.react':
        return 'text/javascript';
      case 'image/svg+xml':
        return 'image/svg+xml';
      case 'text/html':
        return 'text/html';
      default:
        return 'text/plain';
    }
  };

  const getDownloadFileName = (artifact) => {
    const baseName = artifact.title || 'artifact';
    
    switch (artifact.type) {
      case 'application/vnd.ant.code':
        const ext = getCodeExtension(artifact.language);
        return `${baseName}${ext}`;
      case 'text/markdown':
        return `${baseName}.md`;
      case 'application/vnd.ant.react':
        return `${baseName}.jsx`;
      case 'image/svg+xml':
        return `${baseName}.svg`;
      case 'text/html':
        return `${baseName}.html`;
      default:
        return `${baseName}.txt`;
    }
  };

  const getCodeExtension = (language) => {
    const extensions = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      java: '.java',
      cpp: '.cpp',
      c: '.c',
      html: '.html',
      css: '.css',
      json: '.json',
      yaml: '.yml',
      xml: '.xml',
      sql: '.sql',
      bash: '.sh',
      powershell: '.ps1',
      php: '.php',
      ruby: '.rb',
      go: '.go',
      rust: '.rs',
      swift: '.swift',
      kotlin: '.kt',
      scala: '.scala',
    };
    
    return extensions[language?.toLowerCase()] || '.txt';
  };

  const renderContent = () => {
    try {
      switch (artifact.type) {
        case 'application/vnd.ant.code':
          return <CodeArtifact content={artifact.content} language={artifact.language} />;
        
        case 'text/markdown':
          return <MarkdownArtifact content={artifact.content} />;
        
        case 'application/vnd.ant.react':
          return <ReactArtifact content={artifact.content} />;
        
        case 'image/svg+xml':
          return <SVGArtifact content={artifact.content} title={artifact.title} />;
        
        case 'text/html':
          return (
            <Box sx={{ p: 2 }}>
              <iframe
                srcDoc={artifact.content}
                style={{
                  width: '100%',
                  height: '400px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px'
                }}
                title={artifact.title || 'HTML Document'}
                sandbox="allow-scripts allow-same-origin"
              />
            </Box>
          );
        
        default:
          return (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                Неподдерживаемый тип артефакта: {artifact.type}
              </Typography>
              <Box sx={{ 
                bgcolor: 'grey.50',
                borderRadius: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography 
                  variant="body2" 
                  component="pre" 
                  sx={{ 
                    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace',
                    fontSize: '0.875rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: 400,
                    overflow: 'auto',
                    m: 0
                  }}
                >
                  {artifact.content}
                </Typography>
              </Box>
            </Box>
          );
      }
    } catch (error) {
      console.error('Ошибка отображения артефакта:', error);
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            Ошибка отображения артефакта
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error.message}
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Paper 
      ref={artifactRef}
      elevation={0}
      sx={{ 
        mt: 2,
        mb: 2,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          borderColor: typeInfo.color,
        }
      }}
    >
      {/* Заголовок артефакта - стиль как у Claude */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          bgcolor: typeInfo.bgColor,
          borderBottom: '1px solid',
          borderColor: 'divider',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
          {/* Иконка типа */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: 'background.paper',
            color: typeInfo.color
          }}>
            {typeInfo.icon}
          </Box>
          
          {/* Информация о артефакте */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  color: 'text.primary',
                  lineHeight: 1.3
                }}
                noWrap
              >
                {artifact.title || 'Без названия'}
              </Typography>
              <Chip 
                label={typeInfo.label}
                size="small"
                sx={{ 
                  height: 20,
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  bgcolor: typeInfo.color,
                  color: 'white',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            
            {artifact.language && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                  letterSpacing: 0.5
                }}
              >
                {artifact.language}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Кнопки управления */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {copySuccess && (
            <Fade in={copySuccess}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'success.main',
                  fontWeight: 500,
                  mr: 1
                }}
              >
                Скопировано!
              </Typography>
            </Fade>
          )}
          
          <Tooltip title="Копировать">
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); handleCopy(); }}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: typeInfo.color,
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Дополнительно">
            <IconButton 
              size="small"
              onClick={(e) => { e.stopPropagation(); handleMenuClick(e); }}
              sx={{ 
                color: 'text.secondary',
                '&:hover': { 
                  color: typeInfo.color,
                  bgcolor: 'rgba(0,0,0,0.04)'
                }
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          <IconButton 
            size="small"
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            sx={{ 
              color: 'text.secondary',
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          >
            <ExpandMoreIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Содержимое артефакта */}
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ 
          maxHeight: 600, 
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { 
            bgcolor: 'rgba(0,0,0,0.1)', 
            borderRadius: 3,
            '&:hover': { bgcolor: 'rgba(0,0,0,0.2)' }
          }
        }}>
          {renderContent()}
        </Box>
      </Collapse>

      {/* Меню действий */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            minWidth: 200,
            mt: 1,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleCopy}>
          <ListItemIcon>
            <ContentCopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Копировать содержимое</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Скачать файл</ListItemText>
        </MenuItem>
        
        {(artifact.type === 'application/vnd.ant.react' || artifact.type === 'text/html') && (
          <MenuItem onClick={handleOpenInNew}>
            <ListItemIcon>
              <OpenInNewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Открыть в новом окне</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default ArtifactRenderer;