/**
 * Full-Stack API Server
 * 
 * Express server with file-based API routing using Baraqex utilities
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Baraqex server utilities
import { renderToString } from 'baraqex';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logger middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Import API routes
import * as usersApi from './api/users.js';
import * as userByIdApi from './api/users/[id].js';

// Users routes
app.get('/api/users', (req, res) => usersApi.GET(req, res));
app.post('/api/users', (req, res) => usersApi.POST(req, res));
app.put('/api/users', (req, res) => usersApi.PUT(req, res));
app.delete('/api/users', (req, res) => usersApi.DELETE(req, res));

// User by ID routes
app.get('/api/users/:id', (req, res) => userByIdApi.GET(req, res));
app.put('/api/users/:id', (req, res) => userByIdApi.PUT(req, res));
app.patch('/api/users/:id', (req, res) => userByIdApi.PATCH(req, res));
app.delete('/api/users/:id', (req, res) => userByIdApi.DELETE(req, res));

// Health check with SSR demo
app.get('/api/health', (req, res) => {
  // Create a simple VNode for SSR demonstration
  const healthVNode = {
    type: 'div',
    props: {
      className: 'health-check',
      children: [
        { type: 'h1', props: { children: '✅ Server Health' } },
        { type: 'p', props: { children: `Status: OK` } },
        { type: 'p', props: { children: `Timestamp: ${new Date().toISOString()}` } },
        { type: 'p', props: { children: `Uptime: ${process.uptime().toFixed(2)}s` } }
      ]
    }
  };
  
  // Render to HTML string using Baraqex SSR
  const html = renderToString(healthVNode);
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ssrDemo: html
  });
});

// SSR endpoint - renders a page using Baraqex
app.get('/ssr', (req, res) => {
  const pageVNode = {
    type: 'html',
    props: {
      lang: 'en',
      children: [
        {
          type: 'head',
          props: {
            children: [
              { type: 'meta', props: { charset: 'UTF-8' } },
              { type: 'meta', props: { name: 'viewport', content: 'width=device-width, initial-scale=1.0' } },
              { type: 'title', props: { children: 'Baraqex SSR Demo' } },
              { type: 'style', props: { children: `
                body { font-family: system-ui; max-width: 800px; margin: 0 auto; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
                .card { background: white; border-radius: 12px; padding: 2rem; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
                h1 { color: #333; }
                p { color: #666; }
                a { color: #667eea; }
              `}}
            ]
          }
        },
        {
          type: 'body',
          props: {
            children: {
              type: 'div',
              props: {
                className: 'card',
                children: [
                  { type: 'h1', props: { children: '🚀 Baraqex SSR Demo' } },
                  { type: 'p', props: { children: 'This page was rendered on the server using Baraqex renderToString()' } },
                  { type: 'p', props: { children: `Server time: ${new Date().toISOString()}` } },
                  { type: 'a', props: { href: '/', children: '← Back to App' } }
                ]
              }
            }
          }
        }
      ]
    }
  };
  
  const html = '<!DOCTYPE html>' + renderToString(pageVNode);
  res.type('html').send(html);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  🚀 Baraqex Full-Stack API Server          ║
╠════════════════════════════════════════════╣
║  API:     http://localhost:${PORT}/api        ║
║  Health:  http://localhost:${PORT}/api/health ║
║  SSR:     http://localhost:${PORT}/ssr        ║
╚════════════════════════════════════════════╝
  `);
});
