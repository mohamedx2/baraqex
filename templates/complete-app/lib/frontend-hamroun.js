/**
 * Simple JSX implementation for server-side rendering
 */

// Render a virtual DOM node to HTML string
export function renderToString(vnode) {
  // Handle null or undefined
  if (vnode == null) return '';
  
  // Handle primitive values
  if (typeof vnode === 'string' || typeof vnode === 'number') 
    return escapeHtml(String(vnode));
  
  // Handle arrays (like fragments)
  if (Array.isArray(vnode)) 
    return vnode.map(renderToString).join('');
  
  // Handle functional components
  if (typeof vnode.type === 'function') {
    try {
      const result = vnode.type(vnode.props || {});
      return renderToString(result);
    } catch (err) {
      console.error('Error rendering component:', err);
      return `<div class="error">Error: ${escapeHtml(err.message)}</div>`;
    }
  }
  
  // Handle Fragment
  if (vnode.type === Symbol.for('react.fragment')) {
    return renderToString(vnode.props.children);
  }
  
  // Handle regular DOM elements
  if (typeof vnode.type === 'string') {
    let props = vnode.props || {};
    let children = props.children || [];
    if (!Array.isArray(children)) {
      children = [children];
    }
    
    // Build opening tag with attributes
    let html = `<${vnode.type}`;
    
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children' || key === 'dangerouslySetInnerHTML') continue;
      
      // Handle event handlers (they should be ignored in SSR)
      if (key.startsWith('on')) continue;
      
      // Handle className -> class
      if (key === 'className') {
        html += ` class="${escapeHtml(value)}"`;
        continue;
      }
      
      // Handle style objects
      if (key === 'style' && typeof value === 'object') {
        const styleStr = Object.entries(value)
          .map(([k, v]) => `${kebabCase(k)}:${v}`)
          .join(';');
        html += ` style="${escapeHtml(styleStr)}"`;
        continue;
      }
      
      // Handle boolean attributes
      if (value === true) {
        html += ` ${key}`;
        continue;
      }
      
      // Skip false boolean attributes
      if (value === false) continue;
      
      // Regular attributes
      if (value != null) {
        html += ` ${key}="${escapeHtml(value)}"`;
      }
    }
    
    // Handle self-closing tags
    const selfClosing = ['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
    if (selfClosing.includes(vnode.type)) {
      return `${html} />`;
    }
    
    // Add closing bracket for opening tag
    html += '>';
    
    // Handle dangerouslySetInnerHTML
    if (props.dangerouslySetInnerHTML) {
      html += props.dangerouslySetInnerHTML.__html || '';
    } else {
      // Add children
      for (const child of children) {
        html += renderToString(child);
      }
    }
    
    // Add closing tag
    html += `</${vnode.type}>`;
    
    return html;
  }
  
  // Unknown node type
  console.warn('Unknown vnode type:', vnode.type);
  return '';
}

// Create a JSX element
export function jsx(type, props, ...children) {
  props = props || {};
  if (children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }
  return { type, props };
}

// Helper for escaping HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper to convert camelCase to kebab-case for CSS properties
function kebabCase(str) {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// Create a basic requestLogger middleware
export function requestLogger(req, res, next) {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
}

// Create a basic error handler middleware
export function errorHandler(err, req, res, next) {
  console.error('Server error:', err);
  res.status(500).send('Server Error');
}

// Create a basic 404 handler middleware
export function notFoundHandler(req, res) {
  res.status(404).send('Not Found');
}

// Create a basic rate limiter middleware
export function rateLimit(options = { windowMs: 60000, max: 100 }) {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }
    
    const reqs = requests.get(ip);
    const validReqs = reqs.filter(time => now - time < options.windowMs);
    
    validReqs.push(now);
    requests.set(ip, validReqs);
    
    if (validReqs.length > options.max) {
      return res.status(429).send('Too Many Requests');
    }
    
    next();
  };
}

// Export other necessary functions
export const Fragment = Symbol.for('react.fragment');
export function loadGoWasmFromFile() {
  throw new Error('WASM not supported in this environment');
}
