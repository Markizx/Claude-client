// components/Artifacts/MarkdownArtifact.jsx
import React from 'react';
import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

const MarkdownArtifact = ({ content }) => {
  return (
    <Box sx={{ p: 2 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={materialLight}
                language={match[1]}
                PreTag="div"
                customStyle={{
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code 
                className={className} 
                style={{ 
                  backgroundColor: '#f5f5f5',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontSize: '0.875em'
                }}
                {...props}
              >
                {children}
              </code>
            );
          },
          h1: ({ node, ...props }) => (
            <h1 style={{ 
              fontSize: '2em', 
              marginTop: '0.5em', 
              marginBottom: '0.5em',
              borderBottom: '1px solid #eee',
              paddingBottom: '0.3em'
            }} {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 style={{ 
              fontSize: '1.5em', 
              marginTop: '1em', 
              marginBottom: '0.5em',
              borderBottom: '1px solid #eee',
              paddingBottom: '0.3em'
            }} {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 style={{ 
              fontSize: '1.3em', 
              marginTop: '1em', 
              marginBottom: '0.5em' 
            }} {...props} />
          ),
          table: ({ node, ...props }) => (
            <table style={{ 
              borderCollapse: 'collapse', 
              marginTop: '1em', 
              marginBottom: '1em', 
              width: '100%',
              border: '1px solid #ddd'
            }} {...props} />
          ),
          th: ({ node, ...props }) => (
            <th style={{ 
              border: '1px solid #ddd', 
              padding: '8px 12px', 
              backgroundColor: '#f5f5f5',
              textAlign: 'left',
              fontWeight: 'bold'
            }} {...props} />
          ),
          td: ({ node, ...props }) => (
            <td style={{ 
              border: '1px solid #ddd', 
              padding: '8px 12px' 
            }} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote style={{ 
              borderLeft: '4px solid #ddd', 
              paddingLeft: '1em', 
              marginLeft: '0',
              fontStyle: 'italic',
              color: '#666'
            }} {...props} />
          ),
          a: ({ node, ...props }) => (
            <a style={{ 
              color: '#1976d2', 
              textDecoration: 'none'
            }} {...props} />
          ),
          img: ({ node, ...props }) => (
            <img style={{ 
              maxWidth: '100%', 
              height: 'auto',
              display: 'block',
              margin: '1em 0'
            }} {...props} />
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownArtifact;