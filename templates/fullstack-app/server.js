import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
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
const httpServer = createServer(app);

// Create socket.io server
const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    methods: ['GET', 'POST']
  }
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression()); // Add compression for better performance
app.use(cors()); // Enable CORS for API access

// Add request logging in development mode
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// For production, serve the built files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
} else {
  // In development, we'll let Vite handle the frontend
  console.log('Running in development mode - Vite handles the frontend');
}

// Global in-memory store for demo purposes
// In a real app, you would use a database
const store = {
  users: [
    { id: 1, name: 'User 1', email: 'user1@example.com' },
    { id: 2, name: 'User 2', email: 'user2@example.com' },
    { id: 3, name: 'User 3', email: 'user3@example.com' }
  ],
  posts: [
    { id: 1, title: 'Post 1', content: 'Content for post 1', authorId: 1 },
    { id: 2, title: 'Post 2', content: 'Content for post 2', authorId: 2 },
    { id: 3, title: 'Post 3', content: 'Content for post 3', authorId: 1 }
  ]
};

// Core API routes (available without file-based routing)
app.get('/api/hello', (req, res) => {
  res.json({
    message: "Hello from the API!",
    time: new Date().toISOString(),
    features: [
      "Server-side rendering",
      "API routes",
      "Component-based UI",
      "React-like development experience",
      "WebSocket integration",
      "Database connectivity",
      "Authentication"
    ]
  });
});

// REST API endpoints for store data
app.get('/api/users', (req, res) => {
  res.json(store.users);
});

app.get('/api/users/:id', (req, res) => {
  const user = store.users.find(u => u.id === parseInt(req.params.id));
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

app.get('/api/posts', (req, res) => {
  const { authorId } = req.query;
  
  if (authorId) {
    const filteredPosts = store.posts.filter(p => p.authorId === parseInt(authorId));
    return res.json(filteredPosts);
  }
  
  res.json(store.posts);
});

// Improved dynamic API route loading with better error handling
const apiDir = path.join(__dirname, 'api');
if (fs.existsSync(apiDir)) {
  console.log('Loading API routes from directory...');
  
  // Function to map file paths to API routes
  const registerApiRoutes = async (dir, routePrefix = '') => {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Process directories recursively
          await registerApiRoutes(fullPath, `${routePrefix}/${entry.name}`);
        } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
          // Process API file
          try {
            const fileName = entry.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const routePath = fileName === 'index' 
              ? routePrefix 
              : fileName.startsWith('[') && fileName.endsWith(']')
                ? `${routePrefix}/:${fileName.slice(1, -1)}` // Convert [param] to :param
                : `${routePrefix}/${fileName}`;
                
            // Import the route module
            const module = await import(`file://${fullPath}`);
            
            // Register handlers for HTTP methods
            ['get', 'post', 'put', 'delete', 'patch'].forEach(method => {
              if (typeof module[method] === 'function') {
                console.log(`  Registered ${method.toUpperCase()} ${routePath}`);
                app[method](`/api${routePath}`, module[method]);
              }
            });
            
            // Special case for 'delete' which might be named 'delete_' in some files
            if (typeof module['delete_'] === 'function') {
              console.log(`  Registered DELETE ${routePath}`);
              app.delete(`/api${routePath}`, module['delete_']);
            }
          } catch (err) {
            console.error(`Error loading API route ${fullPath}:`, err);
          }
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dir}:`, err);
    }
  };
  
  // Start registering API routes
  registerApiRoutes(apiDir).catch(err => {
    console.error('Error loading API routes:', err);
  });
} else {
  console.log('API directory not found, skipping API route loading');
}

// WebSocket setup
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send welcome message
  socket.emit('welcome', { 
    message: 'Connected to WebSocket server',
    time: new Date().toISOString()
  });
  
  // Handle client messages
  socket.on('message', (data) => {
    console.log('Received message:', data);
    // Broadcast to all clients
    io.emit('broadcast', {
      from: socket.id,
      data,
      time: new Date().toISOString()
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// In production or if using SSR, handle all routes
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // In production, serve the index.html
  if (process.env.NODE_ENV === 'production') {
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      try {
        // Read the index.html file
        let html = fs.readFileSync(indexPath, 'utf8');
        
        // Create initial state for client hydration
        const initialState = {
          route: req.path,
          timestamp: new Date().toISOString()
        };
        
        // Inject initial state for hydration
        html = html.replace(
          '</head>',
          `<script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};</script></head>`
        );
        
        res.send(html);
      } catch (error) {
        console.error('Error serving HTML:', error);
        res.status(500).send('Server Error');
      }
    } else {
      res.status(404).send('Not found');
    }
  } else {
    // In development, use Vite's dev server
    // Instead of redirecting, proxy the request to maintain the URL path
    // This allows Vite to handle the route properly
    const viteDevServerUrl = 'http://localhost:5173';
    
    // Tell the client which route to handle via response headers
    res.setHeader('x-original-route', req.path);
    
    // Forward the request to the Vite dev server with the original path
    res.redirect(302, `${viteDevServerUrl}${req.path}`);
    
    // Note: If the above still causes 404s, you can try this alternative
    // res.redirect(302, `${viteDevServerUrl}/?_path=${encodeURIComponent(req.path)}`);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Frontend development server will run on http://localhost:5173`);
    console.log(`Run 'npm run dev' to start both servers`);
  }
});
