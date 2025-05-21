// components/Chat/SearchDialog.jsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  InputAdornment,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';

const SearchDialog = ({ open, onClose, onResultClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Выполнение поиска с задержкой
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
      setSearchTimeout(timeoutId);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim() || !window.electronAPI) return;

    setLoading(true);
    try {
      const results = await window.electronAPI.searchMessages(query);
      if (Array.isArray(results)) {
        setSearchResults(results);
      } else if (results.error) {
        console.error('Ошибка поиска:', results.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    onResultClick(result);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const formatDate = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#fff3cd', padding: '0 2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Поиск по сообщениям</Typography>
          <IconButton onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ pb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Введите текст для поиска..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            )
          }}
        />

        {!searchQuery.trim() && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Поиск по сообщениям
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Введите текст для поиска по всем вашим чатам
            </Typography>
          </Box>
        )}

        {searchQuery.trim() && !loading && searchResults.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Ничего не найдено
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Попробуйте изменить запрос или использовать другие ключевые слова
            </Typography>
          </Box>
        )}

        {searchResults.length > 0 && (
          <Box>
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Найдено результатов: {searchResults.length}
              </Typography>
              <Chip 
                size="small" 
                label={`${searchResults.length}`} 
                color="primary" 
                variant="outlined"
              />
            </Box>
            
            <List sx={{ maxHeight: 'calc(80vh - 200px)', overflow: 'auto' }}>
              {searchResults.map((result, index) => (
                <React.Fragment key={result.id}>
                  <ListItem
                    button
                    onClick={() => handleResultClick(result)}
                    sx={{ 
                      borderRadius: 1,
                      mx: 0,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { 
                        bgcolor: 'action.hover',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <ChatIcon fontSize="small" color="primary" />
                          <Typography variant="subtitle2" noWrap>
                            {result.chat_title}
                          </Typography>
                          <Chip 
                            label={result.role === 'user' ? 'Вы' : 'Claude'} 
                            size="small" 
                            color={result.role === 'user' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {highlightText(
                              result.content.length > 200 
                                ? result.content.substring(0, 200) + '...'
                                : result.content,
                              searchQuery
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(result.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SearchDialog;