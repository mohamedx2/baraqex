const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';

// Create a fullstack server with basic configuration

if (isNode) {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'development') {
    process.env.NODE_ENV = 'development';
  } else if (env === 'production') {
    process.env.NODE_ENV = 'production';
  }
}
import { createServer } from 'baraqex';


const server = createServer({
  port: process.env.PORT || 3000,
  apiDir: './src/api',
  pagesDir: './src/pages', 
  staticDir: './public',
  enableCors: true,
  // Uncomment and configure database if needed
  // db: {
  //   url: process.env.DATABASE_URL || 'mongodb://localhost:27017/baraqex-app',
  //   type: 'mongodb'
  // },
  // Uncomment and configure authentication if needed  
  // auth: {
  //   secret: process.env.JWT_SECRET || 'your-secret-key',
  //   expiresIn: '7d'
  // }
});

// Add graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    console.log('🚀 Starting Baraqex Fullstack Server...');
    await server.start();
    
    console.log('✅ Server started successfully!');
    console.log(`🌐 Server running at http://localhost:${server.config?.port || 3000}`);
    console.log('📚 API endpoints available at /api/*');
    console.log('📊 API documentation at /api-docs');
    console.log('\n💡 Quick start:');
    console.log('  - Add API routes in ./src/api/');
    console.log('  - Add pages in ./src/pages/');
    console.log('  - Static files go in ./public/');
    console.log('  - Press Ctrl+C to stop the server');
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    
    if (error.message.includes('Express not installed')) {
      console.log('\n💡 To fix this, run:');
      console.log('  npm install express @types/express');
    }
    
    process.exit(1);
  }
}

startServer();
