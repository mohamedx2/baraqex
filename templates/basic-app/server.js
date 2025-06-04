import { createServer } from '../../dist/server/index.js';

const server = createServer({
  port: process.env.PORT || 3000,
  staticDir: './public',
  enableCors: true
});

server.start().then(() => {
  console.log('🚀 Baraqex Basic App server started successfully!');
  console.log('📱 Visit http://localhost:3000 to see your app');
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
