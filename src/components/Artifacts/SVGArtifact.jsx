// components/Artifacts/SVGArtifact.jsx
import React, { useState, useMemo } from 'react';
import { Box, Typography, Alert, IconButton, Tooltip, Paper, Chip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import DownloadIcon from '@mui/icons-material/Download';

const SVGArtifact = ({ content, title }) => {
  const [zoom, setZoom] = useState(100);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Безопасная очистка SVG (упрощенная версия без DOMPurify)
  const sanitizedSvg = useMemo(() => {
    if (!content) return '';
    
    try {
      // Простая проверка на валидность SVG
      if (!content.includes('<svg') || !content.includes('</svg>')) {
        throw new Error('Невалидный SVG контент');
      }

      // Удаляем потенциально опасные теги и атрибуты
      let cleaned = content
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '');

      return cleaned;
    } catch (error) {
      console.error('Ошибка очистки SVG:', error);
      return '';
    }
  }, [content]);

  // Обработчики управления
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 25));
  const handleResetZoom = () => setZoom(100);
  const handleFullscreen = () => setShowFullscreen(true);

  // Скачивание SVG
  const handleDownload = () => {
    try {
      const blob = new Blob([sanitizedSvg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = title ? `${title}.svg` : 'artifact.svg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка при скачивании SVG:', error);
    }
  };

  if (!content) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="text.secondary">
          Нет содержимого SVG
        </Typography>
      </Box>
    );
  }

  if (!sanitizedSvg) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          <Typography variant="body2">
            Невалидный или небезопасный SVG контент
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Панель управления */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 1.5,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            SVG изображение
          </Typography>
          <Chip 
            size="small" 
            label={`${zoom}%`}
            color="primary"
            variant="outlined"
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Уменьшить">
            <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 25}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Сбросить масштаб">
            <IconButton size="small" onClick={handleResetZoom}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Увеличить">
            <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 200}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Полный экран">
            <IconButton size="small" onClick={handleFullscreen}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Скачать SVG">
            <IconButton size="small" onClick={handleDownload}>
              <DownloadIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* SVG контейнер */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        bgcolor: 'background.paper',
        minHeight: 200,
        overflow: 'auto',
        backgroundImage: `
          linear-gradient(45deg, #f5f5f5 25%, transparent 25%),
          linear-gradient(-45deg, #f5f5f5 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #f5f5f5 75%),
          linear-gradient(-45deg, transparent 75%, #f5f5f5 75%)
        `,
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
      }}>
        <Box
          sx={{
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.2s ease',
            transformOrigin: 'center center'
          }}
          dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
        />
      </Box>

      {/* Полноэкранный режим */}
      {showFullscreen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setShowFullscreen(false)}
        >
          <Box
            sx={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            dangerouslySetInnerHTML={{ __html: sanitizedSvg }}
          />
          <IconButton
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
            }}
            onClick={(e) => {
              e.stopPropagation();
              setShowFullscreen(false);
            }}
          >
            <FullscreenIcon />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

export default SVGArtifact;