import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderToString, jsx } from 'frontend-hamroun';
import { App } from './App.js';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = 3000;

// Find the client entry file
const getClientEntry = () => {
  const assetsDir = path.join(__dirname, './');
  const files = fs.readdirSync(assetsDir);
  return files.find(file => file.startsWith("client") && file.endsWith('.js'));
};

// Serve static files from dist/assets
app.use('/assets', express.static(path.join(__dirname, './')));

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Auto-routing middleware - scans the pages directory for components
const getPagesDirectory = () => {
  return path.join(__dirname, 'pages');
};

// Helper to check if a file exists
const fileExists = async (filePath) => {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
};

// Map URL path to component path
const getComponentPath = async (urlPath) => {
  const pagesDir = getPagesDirectory();
  
  // Handle root path
  if (urlPath === '/') {
    const indexPath = path.join(pagesDir, 'index.js');
    if (await fileExists(indexPath)) {
      return { 
        componentPath: indexPath,
        params: {}
      };
    }
  }
  
  // Try direct match (e.g., /about -> /pages/about.js)
  const directPath = path.join(pagesDir, `${urlPath.slice(1)}.js`);
  if (await fileExists(directPath)) {
    return { 
      componentPath: directPath,
      params: {}
    };
  }
  
  // Try directory index (e.g., /about -> /pages/about/index.js)
  const dirIndexPath = path.join(pagesDir, urlPath.slice(1), 'index.js');
  if (await fileExists(dirIndexPath)) {
    return { 
      componentPath: dirIndexPath,
      params: {}
    };
  }
  
  // Look for dynamic routes (with [param] in filename)
  const segments = urlPath.split('/').filter(Boolean);
  const dynamicRoutes = [];
  
  // Recursively scan pages directory for all files
  const scanDir = (dir, basePath = '') => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dir, item.name);
      const routePath = path.join(basePath, item.name);
      
      if (item.isDirectory()) {
        scanDir(itemPath, routePath);
      } else if (item.name.endsWith('.js') && item.name.includes('[')) {
        // This is a dynamic route file
        const urlPattern = routePath
          .replace(/\.js$/, '')
          .replace(/\[([^\]]+)\]/g, ':$1');
        
        dynamicRoutes.push({
          pattern: urlPattern,
          componentPath: itemPath
        });
      }
    }
  };
  
  scanDir(pagesDir);
  
  // Check if any dynamic routes match
  for (const route of dynamicRoutes) {
    const routeSegments = route.pattern.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;
    
    const params = {};
    let matches = true;
    
    for (let i = 0; i < segments.length; i++) {
      const routeSeg = routeSegments[i];
      const urlSeg = segments[i];
      
      if (routeSeg.startsWith(':')) {
        // This is a parameter
        const paramName = routeSeg.slice(1);
        params[paramName] = urlSeg;
      } else if (routeSeg !== urlSeg) {
        matches = false;
        break;
      }
    }
    
    if (matches) {
      return {
        componentPath: route.componentPath,
        params
      };
    }
  }
  
  // No match found
  return null;
};

// Handle all routes with auto-routing
app.get('*', async (req, res) => {
  try {
    const clientEntry = getClientEntry();
    const routeResult = await getComponentPath(req.path);
    
    if (!routeResult) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Page Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body>
            <div id="root">
              <h1>404 - Page Not Found</h1>
              <p>The page you requested could not be found.</p>
            </div>
            <script type="module" src="/assets/${clientEntry}"></script>
          </body>
        </html>
      `);
    }
    
    // Import the component dynamically
    const { default: PageComponent } = await import(routeResult.componentPath);
    
    if (!PageComponent) {
      throw new Error(`Invalid component in ${routeResult.componentPath}`);
    }
    
    // Render the component with params
    const html = await renderToString(jsx(PageComponent, { params: routeResult.params }));
    
    // Create route data for client hydration
    const initialState = {
      route: req.path,
      params: routeResult.params,
      timestamp: new Date().toISOString()
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Frontend Hamroun SSR</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta charset="UTF-8">
        </head>
        <body>
          <div id="root">${html}</div>
          <script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState)}</script>
          <script type="module" src="/assets/${clientEntry}"></script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Rendering error:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>500 - Server Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div id="root">
            <h1>500 - Server Error</h1>
            <p>Something went wrong on the server.</p>
            <pre>${process.env.NODE_ENV === 'production' ? '' : error.stack}</pre>
          </div>
          <script type="module" src="/assets/${clientEntry}"></script>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
