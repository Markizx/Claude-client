import React, { useCallback, useRef } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUploader = ({ onFileSelect, multiple = true, accept, maxSize = 10485760 }) => {
  const fileInputRef = useRef(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (onFileSelect) {
      onFileSelect(acceptedFiles);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    multiple,
    accept,
    maxSize,
  });

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        borderRadius: 2,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: isDragActive 
          ? 'primary.main' 
          : isDragReject 
            ? 'error.main' 
            : 'divider',
        bgcolor: isDragActive ? 'rgba(0, 0, 0, 0.04)' : 'background.paper',
        transition: 'all 0.2s ease',
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'rgba(0, 0, 0, 0.02)',
        },
      }}
      {...getRootProps()}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Перетащите файлы сюда' : 'Перетащите файлы или нажмите для выбора'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {multiple ? 'Можно загрузить несколько файлов' : 'Можно загрузить только один файл'}
        </Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={handleButtonClick}
          sx={{ borderRadius: 2 }}
        >
          Выбрать файлы
        </Button>
      </Box>
    </Paper>
  );
};

export default FileUploader;