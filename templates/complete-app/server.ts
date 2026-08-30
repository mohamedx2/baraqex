import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { renderToString } from 'frontend-hamroun';
import { Database } from 'frontend-hamroun';
import { AuthService } from 'frontend-hamroun';
import { requestLogger, errorHandler, notFoundHandler, rateLimit } from 'frontend-hamroun';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Add middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate limiting for API routes
app.use('/api', rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

// Configure database if connection string is provided
let db = null;
if (process.env.DATABASE_URL) {
  db = new Database({
    url: process.env.DATABASE_URL,
    type: (process.env.DATABASE_TYPE || 'mongodb') as 'mongodb' | 'mysql' | 'postgres'
  });
  
  // Connect to database
  try {
    await db.connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

// Configure auth if secret is provided
let auth = null;
if (process.env.JWT_SECRET) {
  auth = new AuthService({
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
  
  // Add auth middleware
  app.use(auth.initialize());
  
  // Example protected route
  app.get('/api/protected', auth.requireAuth(), (req, res) => {
    res.json({ message: 'Protected route accessed successfully' });
  });
  
  // Example role-based protection
  app.get('/api/admin', auth.requireRoles(['admin']), (req, res) => {
    res.json({ message: 'Admin route accessed successfully' });
  });
  
  // Login route
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    // In a real app, fetch user from database
    const user = { id: 1, username, roles: ['user'] };
    const token = auth.generateToken(user);
    
    res.json({ token, user: { id: user.id, username: user.username, roles: user.roles } });
  });
}

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// API endpoint example
app.get('/api/page-data', (req, res) => {
  res.json({
    title: 'Server-side Data',
    content: 'This data was fetched from the server',
    timestamp: new Date().toISOString()
  });
});

// Meta tag generation function (using local logic for simplicity)
async function generateMetaTags(pageContent) {
  // Extract title from page content
  const title = pageContent.split('\n')[0].replace(/[#*]/g, '').trim() || 
    'Frontend Hamroun SSR Page';
  
  // Generate description from content
  const description = pageContent.substring(0, 150) + '...';
  
  // Extract keywords
  const keywords = pageContent
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 5)
    .join(', ');
  
  return {
    title,
    description,
    keywords
  };
}

// Helper function to check if file exists
async function fileExists(path) {
  try {
    const fs = await import('fs/promises');
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

// Implement basic SSR without relying on complex server functionality
app.get('*', async (req, res) => {
  try {
    // Import the page component
    const pagesDir = join(__dirname, 'src', 'pages');
    let componentPath;
    
    // Map URL path to component file
    if (req.path === '/') {
      componentPath = join(pagesDir, 'index.js');
    } else {
      componentPath = join(pagesDir, `${req.path}.js`);
      // Check if it's a directory with index.js
      if (!await fileExists(componentPath)) {
        componentPath = join(pagesDir, req.path, 'index.js');
      }
    }
    
    // If component doesn't exist, return 404
    if (!await fileExists(componentPath)) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Page Not Found</title>
          </head>
          <body>
            <h1>404 - Page Not Found</h1>
            <p>The page you requested does not exist.</p>
          </body>
        </html>
      `);
    }
    
    // Import the component
    const { default: PageComponent } = await import(componentPath);
    
    // Generate page content for meta tags
    const pageContent = `
      Frontend Hamroun SSR Page
      This is a server-rendered page using the Frontend Hamroun framework.
      Path: ${req.path}
      Timestamp: ${new Date().toISOString()}
    `;
    
    // Generate meta tags
    const metaTags = await generateMetaTags(pageContent);
    
    // Render the component to string
    const content = renderToString(PageComponent());
    
    // Send the HTML response
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- Generated Meta Tags -->
        <title>${metaTags.title}</title>
        <meta name="description" content="${metaTags.description}">
        <meta name="keywords" content="${metaTags.keywords}">
        
        <!-- Open Graph Meta Tags -->
        <meta property="og:title" content="${metaTags.title}">
        <meta property="og:description" content="${metaTags.description}">
        <meta property="og:type" content="website">
        <meta property="og:url" content="${req.protocol}://${req.get('host')}${req.originalUrl}">
        
        <!-- Import Tailwind-like styles for quick styling -->
        <link href="https://cdn.jsdelivr.net/npm/daisyui@3.7.4/dist/full.css" rel="stylesheet" type="text/css" />
        <script src="https://cdn.tailwindcss.com"></script>
        
        <!-- Client-side script for hydration -->
        <script type="module" src="/assets/client.js"></script>
      </head>
      <body>
        <div id="app">${content}</div>
        
        <!-- Add initial state for hydration -->
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify({
            path: req.path,
            timestamp: new Date().toISOString(),
            metaTags
          })};
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error rendering page:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>500 - Server Error</title>
        </head>
        <body>
          <h1>500 - Server Error</h1>
          <p>There was an error processing your request.</p>
          ${process.env.NODE_ENV === 'development' ? `<pre>${error.stack}</pre>` : ''}
        </body>
      </html>
    `);
  }
});

// Add error handler middleware
app.use(errorHandler);

// Add not found handler for API routes that weren't caught
app.use(notFoundHandler);

// Graceful shutdown function to close database connections
function gracefulShutdown() {
  console.log('Shutting down server...');
  
  // Close database connection if it exists
  if (db) {
    db.disconnect()
      .then(() => console.log('Database disconnected'))
      .catch(err => console.error('Error disconnecting from database:', err))
      .finally(() => process.exit(0));
  } else {
    process.exit(0);
  }
}

// Start the server
const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Available API endpoints:`);
  console.log(` - GET /api/page-data`);
  console.log(` - POST /api/login`);
  if (process.env.JWT_SECRET) {
    console.log(` - GET /api/protected (requires authentication)`);
    console.log(` - GET /api/admin (requires admin role)`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
