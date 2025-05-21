import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../../contexts/AuthContext';

const ApiKeySetup = () => {
  const { setApiKey } = useAuth();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const validateApiKey = (apiKey) => {
    if (!apiKey) return 'API ключ не может быть пустым';
    if (!apiKey.startsWith('sk-ant-')) return 'API ключ должен начинаться с "sk-ant-"';
    if (apiKey.length < 20) return 'API ключ слишком короткий';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedKey = key.trim();
    
    // Валидация на клиенте
    const validationError = validateApiKey(trimmedKey);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Отправка API ключа для проверки...');
      const success = await setApiKey(trimmedKey);
      
      if (!success) {
        setError('Не удалось проверить API ключ. Проверьте правильность ключа и подключение к интернету.');
      } else {
        console.log('API ключ успешно установлен');
      }
    } catch (err) {
      console.error('Ошибка при установке API ключа:', err);
      setError('Произошла ошибка при установке API ключа: ' + (err.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyChange = (e) => {
    setKey(e.target.value);
    // Очищаем ошибку при вводе
    if (error) setError('');
  };

  const toggleShowKey = () => {
    setShowKey(!showKey);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          borderRadius: 2,
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3 }}>
          Добро пожаловать в Claude Desktop
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3 }}>
          Для начала работы необходимо ввести API ключ Claude от Anthropic. 
          Получить ключ можно на {' '}
          <Link 
            href="https://console.anthropic.com/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            официальном сайте Anthropic
          </Link>.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Формат ключа: sk-ant-api03-...
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="API ключ"
            variant="outlined"
            fullWidth
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={handleKeyChange}
            placeholder="sk-ant-api03-..."
            sx={{ mb: 3 }}
            required
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="переключить видимость ключа"
                    onClick={toggleShowKey}
                    edge="end"
                  >
                    {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading || !key.trim()}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>Проверка ключа...</span>
              </Box>
            ) : (
              'Сохранить и продолжить'
            )}
          </Button>
        </form>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            <strong>Безопасность:</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
            Ваш API ключ будет храниться локально в зашифрованном виде и никогда не будет передан третьим лицам
          </Typography>
        </Box>
      </Paper>
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
        Возникли проблемы? Убедитесь, что:
        <br />
        • Ключ введен правильно
        <br />
        • У вас есть подключение к интернету
        <br />
        • Ключ активен в консоли Anthropic
      </Typography>
    </Box>
  );
};

export default ApiKeySetup;