import { createServer } from 'baraqex';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create development server
const server = createServer({
  port: parseInt(process.env.PORT || '3000'),
  apiDir: './src/api',
  pagesDir: './src/pages',
  staticDir: './public',
  enableCors: true,
  auth: {
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: '7d'
  }
});

// Enable SSR
server.enableSSR({ hydratable: true });

// Start server
console.log('🚀 Starting Fullstack Baraqex Development Server...');

server.start().then(() => {
  console.log('✅ Server running successfully!');
  console.log('🌐 Frontend: http://localhost:3000');
  console.log('🔗 API: http://localhost:3000/api');
  console.log('📋 API Docs: http://localhost:3000/api-docs');
  console.log('💚 Health: http://localhost:3000/health');
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
