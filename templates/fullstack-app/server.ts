import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import dotenv from 'dotenv';
import { createServer as createHttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import compression from 'compression';
import cors from 'cors';
import * as esbuild from 'esbuild';
import { renderToString, jsx } from 'baraqex';
import { App } from './src/App';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

const app = express();
const httpServer = createHttpServer(app);
const io = new SocketServer(httpServer, {
  cors: { origin: isDev ? '*' : false, methods: ['GET', 'POST'] }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(cors());

// ---------------------------------------------------------------------------
// Sample data store
// ---------------------------------------------------------------------------
const store = {
  users: [
    { id: 1, name: 'Amina', email: 'amina@example.com' },
    { id: 2, name: 'Karim', email: 'karim@example.com' },
    { id: 3, name: 'Sofia', email: 'sofia@example.com' }
  ],
  posts: [
    { id: 1, title: 'Hello Baraqex', authorId: 1 },
    { id: 2, title: 'SSR is fast', authorId: 2 }
  ]
};

// ---------------------------------------------------------------------------
// API routes (backend)
// ---------------------------------------------------------------------------
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from the Baraqex API!', time: new Date().toISOString() });
});

app.get('/api/users', (req, res) => {
  res.json(store.users);
});

app.get('/api/users/:id', (req, res) => {
  const user = store.users.find((u) => u.id === parseInt(req.params.id, 10));
  if (user) return res.json(user);
  res.status(404).json({ error: 'User not found' });
});

app.get('/api/posts', (req, res) => {
  const { authorId } = req.query;
  if (authorId) {
    return res.json(store.posts.filter((p) => p.authorId === parseInt(authorId as string, 10)));
  }
  res.json(store.posts);
});

// ---------------------------------------------------------------------------
// Static assets: built client bundle + public (incl. WASM output)
// ---------------------------------------------------------------------------
app.use('/build', express.static(path.join(__dirname, 'build')));
app.use('/wasm', express.static(path.join(__dirname, 'public', 'wasm')));
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------------------------------------
// Dev mode: esbuild context (bundles src + rebuilds on change)
// ---------------------------------------------------------------------------
let esbuildContext: esbuild.BuildContext<any> | null = null;

async function setupEsbuild() {
  const buildDir = path.join(__dirname, 'build');
  if (!existsSync(buildDir)) await fs.mkdir(buildDir, { recursive: true });

  esbuildContext = await esbuild.context({
    entryPoints: [path.join(__dirname, 'src', 'main.tsx')],
    bundle: true,
    format: 'esm',
    outdir: buildDir,
    sourcemap: true,
    minify: !isDev,
    jsx: 'transform',
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.css': 'css', '.json': 'json' },
    plugins: [
      {
        name: 'baraqex-jsx',
        setup(build) {
          build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
            const source = await fs.readFile(args.path, 'utf8');
            const content = `import { jsx, Fragment } from 'baraqex';\n${source}`;
            return { contents: content, loader: args.path.endsWith('tsx') ? 'tsx' : 'jsx' };
          });
        }
      }
    ],
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') }
  });

  await esbuildContext.rebuild();
  if (!isDev) await esbuildContext.dispose();
  console.log(`esbuild: ${isDev ? 'dev' : 'production'} build complete`);
}

// Build the SSR Tailwind stylesheet (used by both dev and the built server)
async function buildStyles() {
  const buildDir = path.join(__dirname, 'build');
  if (!existsSync(buildDir)) await fs.mkdir(buildDir, { recursive: true });
  const postcss = (await import('postcss')).default;
  const tailwindcss = (await import('tailwindcss')).default;
  const autoprefixer = (await import('autoprefixer')).default;
  const css = await fs.readFile(path.join(__dirname, 'src', 'styles.css'), 'utf8');
  const result = await postcss([tailwindcss, autoprefixer]).process(css, { from: path.join(__dirname, 'src', 'styles.css') });
  await fs.writeFile(path.join(buildDir, 'styles.css'), result.css);
  console.log('✅ styles.css built');
}

// Build the Tailwind stylesheet used by the SSR-rendered page (both modes)
await buildStyles();

// ---------------------------------------------------------------------------
// SSR: render the App on the server, then hydrate on the client
// ---------------------------------------------------------------------------
app.get('*', async (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api/') || req.path.match(/\.(js|css|map|ico|png|jpg|jpeg|gif|svg|woff2?|ttf|eot)$/)) {
    return next();
  }

  try {
    const route = req.path === '/' ? '/' : req.path;
    const initialState = {
      route,
      serverTime: new Date().toISOString(),
      serverRendered: true,
      users: store.users
    };

    const content = await renderToString(jsx(App, { route, initialState }));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baraqex Full-Stack App (SSR + WASM + Go)</title>
  <link rel="stylesheet" href="/build/styles.css">
  <script>window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};</script>
</head>
<body>
  <div id="root">${content}</div>
  <script src="/wasm/wasm_exec.js"></script>
  ${isDev ? '<script src="/socket.io/socket.io.js"></script>' : ''}
  <script src="/build/main.js" type="module"></script>
</body>
</html>`;

    res.send(html);
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Error handling + start
// ---------------------------------------------------------------------------
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).send(`<pre>${isDev ? err.stack : 'Internal Server Error'}</pre>`);
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

if (isDev) {
  const { watch } = await import('chokidar');
  const watcher = watch([path.join(__dirname, 'src', '**/*'), path.join(__dirname, 'go', '**/*')]);

  watcher.on('change', async (changedPath) => {
    console.log(`[Watcher] Changed: ${changedPath}`);
    try {
      await esbuildContext?.rebuild();
      io.emit('reload');
      console.log('[Watcher] Rebuild + reload sent');
    } catch (error) {
      console.error('[Watcher] Rebuild failed:', error);
    }
  });

  console.log('[Watcher] Live reload active');
}

httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('SSR + REST API + WebAssembly (Go) enabled');
  if (isDev) console.log('Development mode with live reload active');
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  if (esbuildContext) await esbuildContext.dispose();
  process.exit(0);
});
