/**
 * HTML template generators for server-side rendering
 */

export interface DocumentOptions {
  title?: string;
  description?: string;
  lang?: string;
  charset?: string;
  viewport?: string;
  scripts?: string[];
  styles?: string[];
  meta?: Record<string, string>;
  bodyClasses?: string;
  htmlAttrs?: Record<string, string>;
  bodyAttrs?: Record<string, string>;
  initialData?: any;
  componentName?: string;
}

/**
 * Generate a complete HTML document
 */
export function generateDocument(
  content: string, 
  options: DocumentOptions = {}
): string {
  const {
    title = 'Frontend Hamroun App',
    description = '',
    lang = 'en',
    charset = 'UTF-8',
    viewport = 'width=device-width, initial-scale=1.0',
    scripts = [],
    styles = [],
    meta = {},
    bodyClasses = '',
    htmlAttrs = {},
    bodyAttrs = {},
    initialData = {},
    componentName = ''
  } = options;
  
  // Generate HTML attributes
  const htmlAttributes = Object.entries(htmlAttrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
  
  // Generate body attributes
  const bodyAttributes = Object.entries(bodyAttrs)
    .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
    .join(' ');
  
  // Generate meta tags
  const metaTags = [
    `<meta charset="${charset}">`,
    `<meta name="viewport" content="${viewport}">`,
    description ? `<meta name="description" content="${escapeHtml(description)}">` : ''
  ];
  
  // Add custom meta tags
  Object.entries(meta).forEach(([name, content]) => {
    metaTags.push(`<meta name="${escapeHtml(name)}" content="${escapeHtml(content)}">`);
  });
  
  // Generate script tags
  const scriptTags = scripts.map(src => {
    if (src.startsWith('<script')) {
      return src; // Allow inline scripts
    }
    // Don't add type="module" to avoid ES6 import issues
    return `<script src="${escapeHtml(src)}" defer></script>`;
  });
  
  // Generate style tags
  const styleTags = styles.map(href => {
    if (href.startsWith('<style')) {
      return href; // Allow inline styles
    }
    return `<link rel="stylesheet" href="${escapeHtml(href)}">`;
  });
  
  // Create initial data script
  const initialDataScript = Object.keys(initialData).length > 0 ? 
    `<script id="__APP_DATA__" type="application/json">${escapeHtml(JSON.stringify(initialData))}</script>` : '';
  
  // Create the complete HTML document
  return `<!DOCTYPE html>
<html lang="${lang}" ${htmlAttributes}>
<head>
  ${metaTags.filter(Boolean).join('\n  ')}
  <title>${escapeHtml(title)}</title>
  ${styleTags.join('\n  ')}
</head>
<body class="${bodyClasses}" ${bodyAttributes}>
  <div id="app-root" data-ssr-root${componentName ? ` data-component="${escapeHtml(componentName)}"` : ''}>${content}</div>
  ${initialDataScript}
  ${scriptTags.join('\n  ')}
</body>
</html>`;
}

/**
 * Generate an error page
 */
export function generateErrorPage(
  statusCode: number, 
  message: string, 
  error?: Error
): string {
  const errorMessages: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error'
  };
  
  const title = `${statusCode} - ${errorMessages[statusCode] || 'Error'}`;
  
  // Generate error details (only in development)
  const isDev = process.env.NODE_ENV !== 'production';
  const errorDetails = isDev && error ? `
    <div class="error-details">
      <pre>${escapeHtml(error.stack || error.message)}</pre>
    </div>
  ` : '';
  
  // Create error content
  const content = `
    <div class="error-container">
      <h1>${statusCode}</h1>
      <h2>${escapeHtml(errorMessages[statusCode] || 'Error')}</h2>
      <p>${escapeHtml(message)}</p>
      ${errorDetails}
      <a href="/" class="home-link">Back to Home</a>
    </div>
  `;
  
  // Add error page styling
  const styles = [`<style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f7f7f7;
      color: #333;
    }
    .error-container {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 600px;
      width: 100%;
    }
    h1 {
      font-size: 6rem;
      margin: 0;
      color: #e74c3c;
    }
    h2 {
      margin-top: 0;
      margin-bottom: 1rem;
      color: #333;
    }
    .error-details {
      text-align: left;
      margin: 2rem 0;
      padding: 1rem;
      background-color: #f8f8f8;
      border-radius: 4px;
      overflow: auto;
    }
    pre {
      margin: 0;
      font-family: monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
    }
    .home-link {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background-color: #3498db;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.2s;
    }
    .home-link:hover {
      background-color: #2980b9;
    }
  </style>`];
  
  return generateDocument(content, {
    title,
    description: `Error ${statusCode}: ${errorMessages[statusCode] || 'Error'}`,
    bodyClasses: 'error-page',
    styles
  });
}

/**
 * Generate a loading page
 */
export function generateLoadingPage(message: string = 'Loading...'): string {
  const content = `
    <div class="loading-container">
      <div class="spinner"></div>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
  
  const styles = [`<style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background-color: #f7f7f7;
      color: #333;
    }
    .loading-container {
      text-align: center;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top-color: #3498db;
      animation: spin 1s ease-in-out infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>`];
  
  return generateDocument(content, {
    title: 'Loading',
    bodyClasses: 'loading-page',
    styles
  });
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
