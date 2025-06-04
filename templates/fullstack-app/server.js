// Temporary workaround - import from relative path during development
import { createServer } from '../../dist/server/index.js';

const server = createServer({
  port: process.env.PORT || 3000,
  apiDir: './src/api',
  pagesDir: './src/pages',
  staticDir: './public',
  enableCors: true,
  // Uncomment to enable database
  // db: {
  //   type: 'mongodb', // or 'mysql', 'postgres'
  //   url: process.env.DATABASE_URL || 'mongodb://localhost:27017/baraqex'
  // },
  // Uncomment to enable authentication
  // auth: {
  //   secret: process.env.JWT_SECRET || 'your-secret-key',
  //   expiresIn: '7d'
  // }
});

server.enableSSR({ hydratable: true });

server.start().then(() => {
  console.log('🚀 Baraqex Full-Stack server started successfully!');
  console.log('📱 Frontend: http://localhost:3000');
  console.log('🔌 API: http://localhost:3000/api');
  console.log('📚 API Docs: http://localhost:3000/api-docs');
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
