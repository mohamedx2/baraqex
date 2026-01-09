/**
 * Full-Stack API Example
 * 
 * Demonstrates:
 * - Server creation and configuration
 * - File-based API routing
 * - Database integration (in-memory for demo)
 * - Authentication middleware
 * - Error handling
 */

import { Server } from 'baraqex/server';

// Create server instance
const server = new Server({
  port: process.env.PORT || 3000,
  apiDir: './api',
  pagesDir: './pages',
  staticDir: './public',
  enableCors: true,
  corsOptions: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  },
  // Optional: Add database configuration
  // db: {
  //   type: 'postgres',
  //   url: process.env.DATABASE_URL
  // },
  // Optional: Add authentication
  // auth: {
  //   secret: process.env.JWT_SECRET || 'your-secret-key',
  //   expiresIn: '7d'
  // }
});

// Start the server
server.start()
  .then(() => {
    console.log(`
  ╔════════════════════════════════════════════╗
  ║  🚀 Baraqex Full-Stack Server              ║
  ╠════════════════════════════════════════════╣
  ║  Local:   http://localhost:${server.config.port}            ║
  ║  API:     http://localhost:${server.config.port}/api        ║
  ╚════════════════════════════════════════════╝
    `);
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
