// components/Artifacts/ArtifactRenderer.jsx
import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CodeArtifact from './CodeArtifact';
import MarkdownArtifact from './MarkdownArtifact';
import ReactArtifact from './ReactArtifact';
import SVGArtifact from './SVGArtifact';

const ArtifactRenderer = ({ artifact }) => {
  if (!artifact) return null;

  const handleDownload = async () => {
    try {
      const blob = new Blob([artifact.content], { 
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
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      console.log('Содержимое артефакта скопировано');
      
      // Показываем уведомление о копировании
      const event = new CustomEvent('show-notification', {
        detail: { message: 'Содержимое скопировано в буфер обмена', type: 'success' }
      });
      window.dispatchEvent(event);
    } catch (error) {
      console.error('Ошибка при копировании:', error);
      
      // Fallback: попытка через старый API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = artifact.content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Содержимое скопировано через fallback метод');
      } catch (fallbackError) {
        console.error('Fallback копирование также не удалось:', fallbackError);
      }
    }
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

  const getArtifactTitle = () => {
    if (artifact.title) return artifact.title;
    
    switch (artifact.type) {
      case 'application/vnd.ant.code':
        return `Код${artifact.language ? ` (${artifact.language})` : ''}`;
      case 'text/markdown':
        return 'Документ Markdown';
      case 'application/vnd.ant.react':
        return 'React компонент';
      case 'image/svg+xml':
        return 'SVG изображение';
      case 'text/html':
        return 'HTML документ';
      default:
        return 'Артефакт';
    }
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
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                title={artifact.title || 'HTML Document'}
                sandbox="allow-scripts allow-same-origin"
              />
            </Box>
          );
        
        default:
          return (
            <Box sx={{ p: 2 }}>
              <Typography color="text.secondary">
                Неподдерживаемый тип артефакта: {artifact.type}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace', 
                  whiteSpace: 'pre-wrap',
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  maxHeight: 300,
                  overflow: 'auto'
                }}>
                  {artifact.content}
                </Typography>
              </Box>
            </Box>
          );
      }
    } catch (error) {
      console.error('Ошибка отображения артефакта:', error);
      return (
        <Box sx={{ p: 2 }}>
          <Typography color="error">
            Ошибка отображения артефакта
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {error.message}
          </Typography>
        </Box>
      );
    }
  };

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        overflow: 'hidden',
        mt: 2,
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          bgcolor: 'grey.50',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" fontWeight="medium" sx={{ fontSize: '0.95rem' }}>
          {getArtifactTitle()}
        </Typography>
        <Box>
          <Tooltip title="Копировать содержимое">
            <IconButton size="small" onClick={handleCopy}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Скачать артефакт">
            <IconButton size="small" onClick={handleDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ maxHeight: 600, overflow: 'auto' }}>
        {renderContent()}
      </Box>
    </Paper>
  );
};

export default ArtifactRenderer;