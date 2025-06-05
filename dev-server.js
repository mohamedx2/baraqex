import { createDevServer } from './src/server/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a development server
const server = createDevServer({
  port: 3000,
  apiDir: './src/api',
  pagesDir: './pages',
  staticDir: './public',
  enableCors: true
});

// Enable SSR with client-side hydration
server.enableSSR({ hydratable: true });

// Add some development middleware
server.getExpressApp().use('/dev-info', (req, res) => {
  res.json({
    message: 'Baraqex Dev Server is running!',
    timestamp: new Date().toISOString(),
    environment: 'development',
    node: process.version,
    platform: process.platform
  });
});

// Start the server
async function startDevServer() {
  try {
    console.log('🚀 Starting Baraqex Development Server...');
    console.log('📂 Project root:', __dirname);
    
    await server.start();
    
    console.log('\n✅ Baraqex Dev Server Started Successfully!');
    console.log('🌐 Server: http://localhost:3000');
    console.log('📊 Dev Info: http://localhost:3000/dev-info');
    console.log('📚 API Docs: http://localhost:3000/api-docs');
    console.log('\n💡 Tips:');
    console.log('  - Place your pages in ./pages/');
    console.log('  - Place your API routes in ./src/api/');
    console.log('  - Static files go in ./public/');
    console.log('  - Press Ctrl+C to stop the server');
    
  } catch (error) {
    console.error('❌ Failed to start dev server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n📴 Shutting down dev server...');
  server.stop().then(() => {
    console.log('✅ Dev server stopped');
    process.exit(0);
  });
});

startDevServer();
