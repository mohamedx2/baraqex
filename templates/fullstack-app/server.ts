import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync, PathLike } from 'fs';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import compression from 'compression';
import cors from 'cors';
import * as esbuild from 'esbuild';

// Setup environment
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const httpServer = createServer(app);

// Set development mode
if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = 'development';
}
const isDev = process.env.NODE_ENV !== 'production';

// Create socket.io server
const io = new SocketServer(httpServer, {
  cors: {
    origin: isDev ? '*' : false,
    methods: ['GET', 'POST']
  }
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());
if (isDev) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

// Sample data store
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

// API Routes
app.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from the API!',
    time: new Date().toISOString()
  });
});

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

// Setup esbuild
let esbuildContext: esbuild.BuildContext<{ entryPoints: string[]; bundle: true; format: "esm"; outdir: string; sourcemap: boolean; minify: boolean; jsx: "transform"; jsxFactory: string; jsxFragment: string; external: string[]; define: { 'process.env.NODE_ENV': string; }; loader: { '.tsx': "tsx"; '.ts': "ts"; '.jsx': "jsx"; '.js': "js"; '.css': "css"; '.json': "json"; '.png': "file"; '.jpg': "file"; '.svg': "file"; }; plugins: { name: string; setup(build: esbuild.PluginBuild): void; }[]; }>;

async function setupEsbuild() {
  const buildDir = path.join(__dirname, 'build');
  if (!existsSync(buildDir)) {
    await fs.mkdir(buildDir, { recursive: true });
  }

  // Import PostCSS, Tailwind and Autoprefixer when in development mode
  let postcssPlugin = null;
  if (isDev) {
    try {
      const postcss = (await import('postcss')).default;
      const tailwindcss = (await import('tailwindcss')).default;
      const autoprefixer = (await import('autoprefixer')).default;
      
      // Create a plugin to process CSS with Tailwind
      postcssPlugin = {
        name: 'postcss-tailwind',
        setup(build: esbuild.PluginBuild) {
          build.onLoad({ filter: /\.css$/ }, async (args) => {
            const css = await fs.readFile(args.path, 'utf8');
            try {
              // Process CSS with PostCSS + Tailwind
              const result = await postcss([
                tailwindcss,
                autoprefixer
              ]).process(css, { 
                from: args.path,
                to: path.join(buildDir, 'styles.css')
              });
              
              return {
                contents: result.css,
                loader: 'css' as esbuild.Loader
              };
            } catch (error) {
              console.error('Error processing CSS with Tailwind:', error);
              return { contents: css, loader: 'css' as esbuild.Loader };
            }
          });
        }
      };
    } catch (error) {
      console.warn('PostCSS plugins not available, CSS will not be processed with Tailwind:', error);
    }
  }

  esbuildContext = await esbuild.context({
    entryPoints: [
      path.join(__dirname, 'src', 'main.tsx'),
    ],
    bundle: true,
    format: 'esm',
    outdir: buildDir,
    sourcemap: isDev,
    minify: !isDev,
    jsx: 'transform',
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    external: ['react', 'react/jsx-runtime', 'react-dom'],
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.jsx': 'jsx',
      '.js': 'js',
      '.css': 'css',
      '.json': 'json',
      '.png': 'file',
      '.jpg': 'file',
      '.svg': 'file'
    },
    plugins: [
      {
        name: 'jsx-runtime-import',
        setup(build) {
          build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
            const source = await fs.readFile(args.path, 'utf8');
            const content = `import { jsx, Fragment } from 'frontend-hamroun';\n${source}`;
            return { contents: content, loader: args.path.endsWith('tsx') ? 'tsx' : 'jsx' };
          });
        }
      },
      ...(postcssPlugin ? [postcssPlugin] : [])
    ]
  });

  if (isDev) {
    await esbuildContext.rebuild();
    console.log('esbuild: Initial build complete');
  } else {
    await esbuildContext.rebuild();
    await esbuildContext.dispose();
    console.log('esbuild: Production build complete');
  }
}

// Initialize esbuild
setupEsbuild().catch(err => {
  console.error('Failed to setup esbuild:', err);
  process.exit(1);
});

// Serve static files
app.use('/build', express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// Development mode file serving
if (isDev) {
  app.get('/src/*', async (req, res, next) => {
    try {
      const filePath = path.join(__dirname, req.path);
      
      // Check if file exists
      if (!existsSync(filePath)) {
        return next();
      }
      
      // Read the file
      const source = await fs.readFile(filePath, 'utf8');
      
      // Determine content type based on file extension
      const ext = path.extname(filePath);
      let contentType = 'application/javascript';
      let loader = 'js';
      
      switch (ext) {
        case '.ts':
          loader = 'ts';
          break;
        case '.tsx':
          loader = 'tsx';
          break;
        case '.jsx':
          loader = 'jsx';
          break;
        case '.css':
          contentType = 'text/css';
          loader = 'css';
          break;
        case '.json':
          contentType = 'application/json';
          loader = 'json';
          break;
      }
      
      // Transform the file with esbuild
      const result = await esbuild.transform(source, {
        loader: loader as esbuild.Loader,
        sourcemap: 'inline',
        jsxFactory: 'jsx',
        jsxFragment: 'Fragment'
      });
      
      res.setHeader('Content-Type', contentType);
      res.send(result.code);
    } catch (error) {
      console.error(`Error serving ${req.path}:`, error);
      next(error);
    }
  });
}

// Helper function to check if file exists
async function fileExists(filepath: PathLike) {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

// Import server utilities directly without WASM functionality
import { renderToString } from 'frontend-hamroun';

// Simple renderComponent implementation
async function renderComponent(Component: (arg0: {}) => any, props = {}) {
  try {
    // Create HTML string from component
    const html = renderToString(Component(props));
    return {
      html,
      success: true
    };
  } catch (error) {
    console.error('Error rendering component:', error);
    return {
      html: `<div class="error">Error rendering component</div>`,
      success: false,
      error
    };
  }
}

// SSR handler for all routes except /api and static files
app.get('*', async (req, res, next) => {
  // Skip API routes, static assets, and build/src files
  if (req.path.startsWith('/api/') || 
      req.path.startsWith('/build/') || 
      req.path.startsWith('/src/') ||
      req.path.match(/\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  console.log(`[SSR] Processing request for: ${req.path}`);
  
  try {
    // Normalize the path
    const pagePath = req.path === '/' ? 'index' : req.path.slice(1);
    
    // Create initial state
    const initialState = {
      route: req.path,
      timestamp: new Date().toISOString(),
      serverRendered: true,
      data: {
        users: store.users || [],
        posts: store.posts || []
      }
    };
    
    // Generate HTML content directly as a string instead of JSX
    const rootContent = `
      <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1>Loading Application...</h1>
        <p>The application is initializing. If you continue to see this message, please ensure JavaScript is enabled in your browser.</p>
      </div>
    `;
    
    // Create HTML template with properly structured content
    const html = `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Frontend Hamroun App</title>
        <!-- Include the processed Tailwind CSS file -->
        <link rel="stylesheet" href="/styles.css">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          pre {
            white-space: pre-wrap;
            word-break: break-word;
          }
        </style>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
        </script>
      </head>
      <body>
        <div id="root">${rootContent}</div>
        <script src="/build/main.js" type="module"></script>
        <script src="/socket.io/socket.io.js"></script>
      </body>
      </html>`;
    
    // Send the rendered HTML
    res.send(html);
  } catch (error) {
    console.error('[SSR] Server error:', error);
    next(error);
  }
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head><title>Server Error</title></head>
      <body>
        <h1>500 - Server Error</h1>
        <p>${err.message}</p>
        ${isDev ? `<pre>${err.stack}</pre>` : ''}
      </body>
    </html>
  `);
});

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

// Handle file changes for live reload in development
if (isDev) {
  const { watch } = await import('chokidar');
  const watcher = watch([
    path.join(__dirname, 'src/**/*'),
    path.join(__dirname, 'public/**/*')
  ]);
  
  watcher.on('change', async (changedPath) => {
    console.log(`[Watcher] File changed: ${changedPath}`);
    
    // Rebuild if source files changed
    if (changedPath.startsWith(path.join(__dirname, 'src'))) {
      try {
        await esbuildContext.rebuild();
        console.log('[Watcher] Rebuild complete');
        
        // Notify clients to reload
        io.emit('reload');
      } catch (error) {
        console.error('[Watcher] Rebuild failed:', error);
      }
    }
    
    // Notify clients of public file changes without rebuild
    if (changedPath.startsWith(path.join(__dirname, 'public'))) {
      io.emit('reload');
    }
  });
  
  console.log('[Watcher] File watching enabled for development');
}

// API routes
app.get('/api/posts', (req, res) => {
  const { authorId } = req.query;
  
  if (authorId) {
    const filteredPosts = store.posts.filter(p => p.authorId === parseInt( authorId as string));
    return res.json(filteredPosts);
  }
  
  res.json(store.posts);
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Server-side rendering enabled with direct esbuild compilation`);
  
  if (isDev) {
    console.log(`Development mode with live reload active`);
  }
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Dispose esbuild context if active
  if (esbuildContext) {
    await esbuildContext.dispose();
  }
  
  process.exit(0);
});
