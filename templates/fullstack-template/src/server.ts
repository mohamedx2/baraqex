import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Server configuration
const config = {
  port: parseInt(process.env.PORT || '3000'),
  apiDir: './src/api',
  pagesDir: './src/pages',
  staticDir: './public',
  enableCors: true,
  corsOptions: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || false 
      : true,
    credentials: true
  },
  db: process.env.DATABASE_URL ? {
    url: process.env.DATABASE_URL,
    type: (process.env.DATABASE_TYPE as 'mongodb' | 'mysql' | 'postgres') || 'mongodb'
  } : undefined,
  auth: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  }
};

// Wait for baraqex to be ready
async function waitForBaraqex() {
  const maxWait = 10000;
  const interval = 100;
  let waited = 0;
  
  while (waited < maxWait) {
    try {
      const baraqex = await import('baraqex');
      if (baraqex.createServer && typeof baraqex.createServer === 'function') {
        return baraqex;
      }
    } catch (error) {
      // Continue waiting
    }
    
    await new Promise(resolve => setTimeout(resolve, interval));
    waited += interval;
  }
  
  throw new Error('Baraqex failed to initialize within timeout period');
}

// Async function to start server
async function startServer() {
  try {
    console.log('🔄 Waiting for Baraqex to initialize...');
    
    // Wait for baraqex to be ready
    const baraqex = await waitForBaraqex();
    const { createServer } = baraqex;
    
    console.log('✅ Baraqex initialized successfully');
    
    if (!createServer || typeof createServer !== 'function') {
      throw new Error('createServer function not available from baraqex package');
    }

    // Create server instance
    const server = createServer(config);
    
    // Wait for server initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Start the server first
    console.log('🚀 Starting server...');
    await server.start();
    
    // Then try to set up additional endpoints after server is running
    try {
      if (typeof server.getExpressApp === 'function') {
        const app = server.getExpressApp();
        
        if (app) {
          // Health check endpoint
          app.get('/health', (_req: any, res: { json: (arg0: { status: string; timestamp: string; version: string; environment: string; }) => void; }) => {
            res.json({ 
              status: 'ok', 
              timestamp: new Date().toISOString(),
              version: process.env.npm_package_version || '1.0.0',
              environment: process.env.NODE_ENV || 'development'
            });
          });

          // API status endpoint
          app.get('/api/status', (_req: any, res: { json: (arg0: { api: string; database: string; authentication: string; timestamp: string; }) => void; }) => {
            let db = null;
            let auth = null;
            
            try {
              if (typeof server.getDatabase === 'function') {
                db = server.getDatabase();
              }
            } catch (e) {
              // Database method not available
            }
            
            try {
              if (typeof server.getAuth === 'function') {
                auth = server.getAuth();
              }
            } catch (e) {
              // Auth method not available
            }
            
            res.json({
              api: 'online',
              database: db ? 'connected' : 'not configured',
              authentication: auth ? 'enabled' : 'disabled',
              timestamp: new Date().toISOString()
            });
          });
        }
      }
    } catch (setupError:any) {
      console.warn('⚠️ Could not set up additional endpoints:', setupError.message);
    }

    // Database connection (if configured)
    await connectDatabase(server);
    
    console.log(`🚀 Fullstack server running on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Safely check auth status
    let authStatus = 'disabled';
    try {
      if (typeof server.getAuth === 'function') {
        authStatus = server.getAuth() ? 'enabled' : 'disabled';
      }
    } catch (e) {
      // Auth check failed
    }
    console.log(`🔑 Auth: ${authStatus}`);
    
    // Safely check database status
    let dbStatus = 'not configured';
    try {
      if (typeof server.getDatabase === 'function') {
        dbStatus = server.getDatabase() ? 'connected' : 'not configured';
      }
    } catch (e) {
      // Database check failed
    }
    console.log(`💾 Database: ${dbStatus}`);
    
    console.log(`🌐 API docs: http://localhost:${config.port}/api-docs`);
    console.log(`❤️  Health check: http://localhost:${config.port}/health`);
    
    return server;
    
  } catch (error:any) {
    console.error('❌ Failed to start server:', error);
    
    if (error.message.includes('Express not installed')) {
      console.log('\n💡 To fix this, run:');
      console.log('  npm install express @types/express');
    } else if (error.message.includes('createServer function not available')) {
      console.log('\n💡 To fix this, make sure baraqex is properly installed:');
      console.log('  npm install baraqex');
      console.log('  npm install express @types/express');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Baraqex is taking longer than expected to initialize.');
      console.log('  This might be due to missing dependencies.');
      console.log('  Try installing: npm install express @types/express');
    }
    
    process.exit(1);
  }
}

// Database connection helper
async function connectDatabase(server: { getDatabase: () => any; }) {
  let db = null;
  try {
    if (typeof server.getDatabase === 'function') {
      db = server.getDatabase();
    }
  } catch (e) {
    console.log('⚠️  Database functionality not available');
    return;
  }
  
  if (db && typeof db.connect === 'function') {
    try {
      await db.connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  } else {
    console.log('⚠️  No database configured');
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
