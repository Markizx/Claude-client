import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Divider,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ShareIcon from '@mui/icons-material/Share';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import ArtifactRenderer from '../Artifacts/ArtifactRenderer';

const MessageItem = React.memo(({ 
  message, 
  onAction, 
  isLast = false,
  showTimestamp = true,
  compact = false 
}) => {
  const [showFiles, setShowFiles] = useState(false);
  const [showArtifacts, setShowArtifacts] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Мемоизированные значения
  const isUser = useMemo(() => message?.role === 'user', [message?.role]);
  const hasFiles = useMemo(() => message?.attachments?.length > 0, [message?.attachments?.length]);
  
  // Мемоизированное форматирование времени
  const formattedTime = useMemo(() => {
    try {
      if (!message?.timestamp) return '';
      
      const date = new Date(message.timestamp);
      if (isNaN(date.getTime())) return '';
      
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit'
      });
    } catch (error) {
      return '';
    }
  }, [message?.timestamp]);

  // Мемоизированная обработка артефактов
  const processedContent = useMemo(() => {
    if (!message?.content || typeof message.content !== 'string') {
      return { cleanContent: message?.content || '', artifacts: [] };
    }
    
    const artifacts = [];
    const artifactRegex = /<artifact\s+([^>]*)>([\s\S]*?)<\/artifact>/g;
    
    let match;
    while ((match = artifactRegex.exec(message.content)) !== null) {
      const attributesString = match[1];
      const artifactContent = match[2];
      
      const identifierMatch = attributesString.match(/identifier\s*=\s*["']([^"']+)["']/);
      const typeMatch = attributesString.match(/type\s*=\s*["']([^"']+)["']/);
      const titleMatch = attributesString.match(/title\s*=\s*["']([^"']+)["']/);
      const languageMatch = attributesString.match(/language\s*=\s*["']([^"']+)["']/);
      
      if (identifierMatch) {
        artifacts.push({
          id: identifierMatch[1],
          type: typeMatch ? typeMatch[1] : 'text/plain',
          title: titleMatch ? titleMatch[1] : 'Артефакт',
          language: languageMatch ? languageMatch[1] : null,
          content: artifactContent.trim()
        });
      }
    }
    
    const cleanContent = message.content.replace(artifactRegex, '').trim();
    return { cleanContent, artifacts };
  }, [message?.content]);

  const allArtifacts = useMemo(() => [
    ...(message?.artifacts || []),
    ...processedContent.artifacts
  ], [message?.artifacts, processedContent.artifacts]);

  // Оптимизированные обработчики событий
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message?.content || '');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Ошибка копирования:', error);
    }
    setAnchorEl(null);
  }, [message?.content]);

  const handleMenuClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleEdit = useCallback(() => {
    setEditContent(message?.content || '');
    setEditDialogOpen(true);
    setAnchorEl(null);
  }, [message?.content]);

  const handleEditSave = useCallback(() => {
    if (onAction && editContent.trim() !== (message?.content || '')) {
      onAction('edit', { id: message?.id, content: editContent.trim() });
    }
    setEditDialogOpen(false);
  }, [onAction, editContent, message?.id, message?.content]);

  const handleDelete = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (onAction) {
      onAction('delete', message?.id);
    }
    setDeleteDialogOpen(false);
  }, [onAction, message?.id]);

  const handleRegenerate = useCallback(() => {
    if (onAction) {
      onAction('regenerate');
    }
    setAnchorEl(null);
  }, [onAction]);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const toggleFiles = useCallback(() => {
    setShowFiles(prev => !prev);
  }, []);

  const toggleArtifacts = useCallback(() => {
    setShowArtifacts(prev => !prev);
  }, []);

  // Мемоизированный компонент для отображения файлов
  const FileChips = useMemo(() => {
    if (!hasFiles) return null;
    
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
        {message.attachments.map((file, index) => (
          <Chip
            key={index}
            icon={<InsertDriveFileIcon />}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <span>{file.name}</span>
                <Typography variant="caption" color="inherit" sx={{ opacity: 0.7 }}>
                  ({Math.round((file.size || 0) / 1024)}KB)
                </Typography>
              </Box>
            }
            size="small"
            variant="outlined"
            sx={{ maxWidth: 250 }}
          />
        ))}
      </Box>
    );
  }, [hasFiles, message?.attachments]);

  // Мемоизированный компонент Markdown
  const MarkdownContent = useMemo(() => {
    if (!processedContent.cleanContent) return null;
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => (
            <Typography variant="body1" paragraph sx={{ mb: 1, '&:last-child': { mb: 0 } }}>
              {children}
            </Typography>
          ),
          h1: ({ children }) => (
            <Typography variant="h4" gutterBottom sx={{ mt: 2, mb: 1 }}>
              {children}
            </Typography>
          ),
          h2: ({ children }) => (
            <Typography variant="h5" gutterBottom sx={{ mt: 1.5, mb: 1 }}>
              {children}
            </Typography>
          ),
          h3: ({ children }) => (
            <Typography variant="h6" gutterBottom sx={{ mt: 1, mb: 0.5 }}>
              {children}
            </Typography>
          ),
          code: ({ inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <Box sx={{ my: 1 }}>
                <SyntaxHighlighter
                  style={materialLight}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                    margin: 0
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </Box>
            ) : (
              <Box 
                component="code" 
                sx={{ 
                  backgroundColor: 'action.hover', 
                  px: 0.5, 
                  py: 0.25, 
                  borderRadius: 0.5,
                  fontFamily: 'monospace',
                  fontSize: '0.9em'
                }}
                {...props}
              >
                {children}
              </Box>
            );
          },
          blockquote: ({ children }) => (
            <Box sx={{ 
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              pl: 2, py: 1, my: 1,
              bgcolor: 'action.hover',
              fontStyle: 'italic'
            }}>
              {children}
            </Box>
          ),
          a: ({ href, children }) => (
            <Typography 
              component="a" 
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ 
                color: 'primary.main', 
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              {children}
            </Typography>
          )
        }}
      >
        {processedContent.cleanContent}
      </ReactMarkdown>
    );
  }, [processedContent.cleanContent]);

  if (!message) return null;

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'row', 
      mb: compact ? 2 : 3,
      alignItems: 'flex-start',
      gap: 1.5,
      position: 'relative',
      '&:hover .message-actions': { opacity: 1 }
    }}>
      <Avatar sx={{ 
        bgcolor: isUser ? 'primary.main' : 'secondary.main',
        width: compact ? 32 : 40,
        height: compact ? 32 : 40,
        mt: 0.5
      }}>
        {isUser ? <AccountCircleIcon /> : <SmartToyIcon />}
      </Avatar>

      <Box sx={{ flexGrow: 1, maxWidth: 'calc(100% - 60px)' }}>
        <Paper elevation={1} sx={{ 
          p: compact ? 1.5 : 2, 
          bgcolor: isUser ? 'primary.main' : 'background.paper',
          color: isUser ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          border: !isUser ? '1px solid' : 'none',
          borderColor: 'divider',
          position: 'relative'
        }}>
          <Box sx={{ mb: (hasFiles || allArtifacts.length > 0) ? 1.5 : 0 }}>
            {isUser ? (
              <Typography variant="body1" sx={{ 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {message.content || ''}
              </Typography>
            ) : (
              MarkdownContent
            )}
          </Box>

          {hasFiles && (
            <>
              <Divider sx={{ my: 1.5, opacity: isUser ? 0.3 : 1 }} />
              <Box>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  mb: showFiles ? 1 : 0
                }}
                onClick={toggleFiles}>
                  <Typography variant="body2" sx={{ 
                    mr: 1,
                    color: isUser ? 'primary.contrastText' : 'text.secondary'
                  }}>
                    Файлы ({message.attachments.length})
                  </Typography>
                  <IconButton size="small" sx={{ 
                    color: isUser ? 'primary.contrastText' : 'text.secondary'
                  }}>
                    {showFiles ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showFiles}>
                  {FileChips}
                </Collapse>
              </Box>
            </>
          )}

          <Box className="message-actions" sx={{ 
            position: 'absolute',
            top: 8, right: 8,
            opacity: 0,
            transition: 'opacity 0.2s',
            bgcolor: isUser ? 'rgba(255,255,255,0.1)' : 'background.paper',
            borderRadius: 1,
            backdropFilter: 'blur(4px)'
          }}>
            <Tooltip title="Действия">
              <IconButton size="small" onClick={handleMenuClick} sx={{ 
                color: isUser ? 'primary.contrastText' : 'text.secondary'
              }}>
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {allArtifacts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              mb: showArtifacts ? 1 : 0
            }}
            onClick={toggleArtifacts}>
              <Typography variant="subtitle2" sx={{ mr: 1 }}>
                Артефакты ({allArtifacts.length})
              </Typography>
              <IconButton size="small">
                {showArtifacts ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={showArtifacts}>
              <Box>
                {allArtifacts.map((artifact, index) => (
                  <ArtifactRenderer
                    key={artifact.id || artifact.artifact_id || index}
                    artifact={artifact}
                  />
                ))}
              </Box>
            </Collapse>
          </Box>
        )}

        {showTimestamp && (
          <Box sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1
          }}>
            <Typography variant="caption" color="text.secondary">
              {formattedTime}
            </Typography>
            
            {copySuccess && (
              <Typography variant="caption" color="success.main" sx={{ ml: 1 }}>
                Скопировано!
              </Typography>
            )}
          </Box>
        )}

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <MenuItem onClick={handleCopy}>
            <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
            Копировать
          </MenuItem>
          
          {isUser && (
            <MenuItem onClick={handleEdit}>
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Редактировать
            </MenuItem>
          )}
          
          {!isUser && isLast && (
            <MenuItem onClick={handleRegenerate}>
              <RefreshIcon fontSize="small" sx={{ mr: 1 }} />
              Регенерировать
            </MenuItem>
          )}
          
          <MenuItem onClick={handleShare}>
            <ShareIcon fontSize="small" sx={{ mr: 1 }} />
            Поделиться
          </MenuItem>
          
          <Divider />
          
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Удалить
          </MenuItem>
        </Menu>

        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Редактировать сообщение</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Содержимое сообщения"
              fullWidth
              multiline
              rows={6}
              variant="outlined"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
            <Button 
              onClick={handleEditSave}
              variant="contained"
              disabled={!editContent.trim() || editContent.trim() === (message?.content || '')}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Удалить сообщение?</DialogTitle>
          <DialogContent>
            <Typography>
              Вы уверены, что хотите удалить это сообщение? Это действие нельзя отменить.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Поделиться сообщением</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Вы можете скопировать содержимое сообщения и поделиться им.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={8}
              variant="outlined"
              value={message?.content || ''}
              InputProps={{ readOnly: true }}
              sx={{ mt: 1 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Закрыть</Button>
            <Button 
              onClick={() => {
                handleCopy();
                setShareDialogOpen(false);
              }}
              variant="contained"
              startIcon={<ContentCopyIcon />}
            >
              Копировать
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
});

MessageItem.displayName = 'MessageItem';

export default MessageItem;