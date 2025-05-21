// components/Artifacts/ArtifactRenderer.jsx
import React from 'react';
import { Box, Typography, Paper, IconButton, Tooltip, Divider } from '@mui/material';
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
      if (window.electronAPI) {
        await window.electronAPI.downloadArtifact(artifact.id);
      }
    } catch (error) {
      console.error('Ошибка при скачивании артефакта:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
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
    switch (artifact.type) {
      case 'application/vnd.ant.code':
        return <CodeArtifact content={artifact.content} language={artifact.language} />;
      
      case 'text/markdown':
        return <MarkdownArtifact content={artifact.content} />;
      
      case 'application/vnd.ant.react':
        return <ReactArtifact content={artifact.content} />;
      
      case 'image/svg+xml':
        return <SVGArtifact content={artifact.content} />;
      
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
            />
          </Box>
        );
      
      default:
        return (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary">
              Неподдерживаемый тип артефакта: {artifact.type}
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