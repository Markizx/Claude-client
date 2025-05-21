// components/Artifacts/CodeArtifact.jsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight, materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeArtifact = ({ content, language = 'text', title, isDarkMode = false }) => {
  if (!content) {
    return (
      <Box sx={{ p: 2 }}>
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
      'cmd': 'bash'
    };
    
    return langMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  const style = isDarkMode ? materialDark : materialLight;
  const languageName = getLanguageName(language);

  return (
    <Box>
      {title && (
        <Box sx={{ px: 2, pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {language && <span style={{ textTransform: 'uppercase' }}>{language}</span>}
          </Typography>
        </Box>
      )}
      <Box sx={{ '& pre': { margin: 0 } }}>
        <SyntaxHighlighter
          language={languageName}
          style={style}
          customStyle={{
            fontSize: '14px',
            lineHeight: '1.5',
            margin: 0,
            borderRadius: 0,
            background: 'transparent'
          }}
          codeTagProps={{
            style: {
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", Consolas, source-code-pro, monospace'
            }
          }}
        >
          {content}
        </SyntaxHighlighter>
      </Box>
    </Box>
  );
};

export default CodeArtifact;