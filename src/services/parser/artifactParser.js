// services/parser/artifactParser.js
export const extractArtifacts = (content) => {
  if (!content || typeof content !== 'string') return [];
  
  const artifacts = [];
  
  // Регулярное выражение для поиска артефактов
  const artifactRegex = /<artifact([^>]*?)>([\s\S]*?)<\/artifact>/g;
  
  let match;
  while ((match = artifactRegex.exec(content)) !== null) {
    const attributeString = match[1];
    const artifactContent = match[2];
    const fullMatch = match[0];
    
    // Извлекаем атрибуты
    const attributes = extractArtifactAttributes(attributeString);
    
    if (attributes.identifier) {
      artifacts.push({
        id: attributes.identifier,
        type: attributes.type || 'text/plain',
        title: attributes.title || '',
        language: attributes.language || detectLanguage(artifactContent),
        content: artifactContent.trim(),
        rawMatch: fullMatch
      });
    }
  }
  
  return artifacts;
};

const extractArtifactAttributes = (attributeString) => {
  const attributes = {};
  
  const patterns = {
    identifier: /identifier\s*=\s*["']([^"']+)["']/,
    type: /type\s*=\s*["']([^"']+)["']/,
    title: /title\s*=\s*["']([^"']+)["']/,
    language: /language\s*=\s*["']([^"']+)["']/
  };
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = attributeString.match(pattern);
    if (match) {
      attributes[key] = match[1];
    }
  }
  
  return attributes;
};

export const removeArtifactsFromText = (content, artifacts) => {
  let cleanContent = content;
  
  artifacts.forEach(artifact => {
    if (artifact.rawMatch) {
      cleanContent = cleanContent.replace(artifact.rawMatch, '');
    }
  });
  
  return cleanContent.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
};

export const detectLanguage = (content) => {
  if (!content || typeof content !== 'string') return 'text';
  
  const contentLower = content.toLowerCase();
  
  // JavaScript/TypeScript
  if (contentLower.includes('import ') || 
      contentLower.includes('export ') || 
      contentLower.includes('function ') ||
      contentLower.includes('const ') ||
      contentLower.includes('let ') ||
      contentLower.includes('var ')) {
    if (contentLower.includes('interface ') || 
        contentLower.includes(': string') ||
        contentLower.includes(': number')) {
      return 'typescript';
    }
    return 'javascript';
  }
  
  // Python
  if (contentLower.includes('def ') || 
      contentLower.includes('import ') ||
      contentLower.includes('from ') ||
      contentLower.includes('class ') ||
      contentLower.includes('print(')) {
    return 'python';
  }
  
  // HTML
  if (contentLower.includes('<!doctype') || 
      contentLower.includes('<html') ||
      contentLower.includes('<div') ||
      contentLower.includes('<body')) {
    return 'html';
  }
  
  // CSS
  if (contentLower.includes('{') && contentLower.includes('}') && 
      (contentLower.includes('color:') || 
       contentLower.includes('margin:') || 
       contentLower.includes('padding:'))) {
    return 'css';
  }
  
  // JSON
  const trimmed = content.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(content);
      return 'json';
    } catch (e) {
      // Не JSON
    }
  }
  
  // SQL
  if (contentLower.includes('select ') ||
      contentLower.includes('create ') ||
      contentLower.includes('insert ') ||
      contentLower.includes('update ')) {
    return 'sql';
  }
  
  return 'text';
};

export const isValidSVG = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<svg') && trimmed.includes('</svg>');
};

export const isValidHTML = (content) => {
  if (!content || typeof content !== 'string') return false;
  return content.includes('<') && content.includes('>');
};

export const formatCode = (content, language) => {
  if (!content || typeof content !== 'string') return content;
  
  switch (language?.toLowerCase()) {
    case 'json':
      try {
        return JSON.stringify(JSON.parse(content), null, 2);
      } catch (e) {
        return content;
      }
    default:
      return content;
  }
};

export default {
  extractArtifacts,
  removeArtifactsFromText,
  extractArtifactAttributes,
  detectLanguage,
  isValidSVG,
  isValidHTML,
  formatCode
};