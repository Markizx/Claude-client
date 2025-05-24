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
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
        bgcolor: 'var(--background-primary)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: (theme) => theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 20% 50%, rgba(0, 217, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(238, 0, 255, 0.1) 0%, transparent 50%)'
            : 'radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          width: '100%',
          borderRadius: 'var(--border-radius)',
          background: (theme) => theme.palette.mode === 'dark' 
            ? 'rgba(22, 22, 37, 0.95)' 
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -2,
            left: -2,
            right: -2,
            bottom: -2,
            background: 'var(--gradient-primary)',
            borderRadius: 'var(--border-radius)',
            opacity: 0.3,
            zIndex: -1,
            filter: 'blur(20px)',
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
          <Box sx={{
            background: 'var(--gradient-primary)',
            borderRadius: '16px',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: (theme) => theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 217, 255, 0.4)' 
              : '0 8px 32px rgba(99, 102, 241, 0.4)',
          }}>
            <SmartToyIcon sx={{ color: 'white', fontSize: 48 }} />
          </Box>
        </Box>

        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 3,
            fontWeight: 600,
            background: 'var(--gradient-primary)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Добро пожаловать в SmartChat.ai
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: 'var(--text-secondary)' }}>
          Для начала работы необходимо ввести API ключ Claude от Anthropic. 
          Получить ключ можно на {' '}
          <Link 
            href="https://console.anthropic.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{
              color: 'var(--accent-primary)',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              }
            }}
          >
            официальном сайте Anthropic
          </Link>.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="var(--text-secondary)">
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
            fullWidth
            size="large"
            disabled={loading || !key.trim()}
            sx={{ 
              py: 1.5,
              borderRadius: 'var(--border-radius-lg)',
              textTransform: 'none',
              fontSize: '1rem',
              background: 'var(--gradient-button)',
              boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
              '&:hover': {
                transform: 'translateY(-2px)',
boxShadow: '0 6px 20px rgba(99, 102, 241, 0.4)',
}
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
      <Typography variant="body2" color="var(--text-secondary)" align="center">
        <strong>Безопасность:</strong>
      </Typography>
      <Typography variant="body2" color="var(--text-secondary)" align="center" sx={{ mt: 1 }}>
        Ваш API ключ будет храниться локально в зашифрованном виде и никогда не будет передан третьим лицам
      </Typography>
    </Box>
  </Paper>
  
  <Typography variant="body2" color="var(--text-secondary)" sx={{ mt: 4, textAlign: 'center' }}>
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