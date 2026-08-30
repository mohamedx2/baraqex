import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
// Fix imports by using only the exports that exist
import { 
  renderToString, 
  jsx,
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimit
} from './lib/frontend-hamroun.js';
import dotenv from 'dotenv';
import compression from 'compression';
import cors from 'cors';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cors()); // Enable CORS
app.use(requestLogger); // Log all requests

// Add rate limiting to prevent abuse
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Serve static files from the public directory
// Important: This middleware should be defined BEFORE your catch-all route
app.use(express.static(path.join(__dirname, 'public')));

// Add correct MIME type for client.js module
app.get('/client.js', (req, res) => {
  res.type('application/javascript').sendFile(path.join(__dirname, 'public', 'client.js'));
});

// Serve WebAssembly files with correct MIME type
app.get('*.wasm', (req, res, next) => {
  res.type('application/wasm');
  next();
});

// Add API routes example
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from the API!',
    serverTime: new Date().toISOString()
  });
});

// Find the pages directory
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
  const possibleExtensions = ['.js']; 
  
  for (const ext of possibleExtensions) {
    const directPath = path.join(pagesDir, `${urlPath.slice(1)}${ext}`);
    if (await fileExists(directPath)) {
      return { 
        componentPath: directPath,
        params: {}
      };
    }
  }
  
  // Try directory index (e.g., /about -> /pages/about/index.js)
  for (const ext of possibleExtensions) {
    const dirIndexPath = path.join(pagesDir, urlPath.slice(1), `index${ext}`);
    if (await fileExists(dirIndexPath)) {
      return { 
        componentPath: dirIndexPath,
        params: {}
      };
    }
  }
  
  // No match found
  return null;
};

// Handle all GET routes with SSR - explicitly exclude /public/ paths
app.get('*', async (req, res, next) => {
  try {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Skip static assets - check file extensions that should be handled as static
    if (req.path.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|wasm|txt|pdf|json|map)$/)) {
      return next();
    }

    // Try to find the matching component
    const routeResult = await getComponentPath(req.path);
    
    if (!routeResult) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Page Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="/styles.css" rel="stylesheet" type="text/css">
          </head>
          <body>
            <div id="app">
              <div class="container">
                <h1>404 - Page Not Found</h1>
                <p>The page you requested could not be found.</p>
                <a href="/" class="button">Go to Home</a>
              </div>
            </div>
            <script id="__APP_DATA__" type="application/json">${JSON.stringify({
              path: req.path,
              error: 'not_found'
            })}</script>
            <script type="module" src="/client.js"></script>
          </body>
        </html>
      `);
    }
    
    // Import the component
    try {
      const componentUrl = `file://${routeResult.componentPath}`;
      const moduleImport = await import(componentUrl);
      const PageComponent = moduleImport.default || moduleImport;
      
      if (!PageComponent || typeof PageComponent !== 'function') {
        throw new Error(`Invalid component in ${routeResult.componentPath}`);
      }

      // Create props with route data
      const initialProps = {
        params: routeResult.params,
        path: req.path,
        query: req.query,
        api: {
          serverTime: new Date().toISOString()
        }
      };
      
      // Render the component
      const result = PageComponent(initialProps);
      let html = renderToString(result);
      
      // Send complete HTML with hydration data
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Frontend Hamroun App</title>
            <link href="/styles.css" rel="stylesheet" type="text/css">
          </head>
          <body>
            <div id="app">${html}</div>
            <script id="__APP_DATA__" type="application/json">${JSON.stringify(initialProps)}</script>
            <script type="module" src="/client.js"></script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Error rendering component:', error);
      next(error);
    }
  } catch (error) {
    next(error);
  }
});

// Add error handler middleware
app.use(errorHandler);

// Add 404 handler for API routes
app.use(notFoundHandler);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
});
