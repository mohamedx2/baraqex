import { createServer, AuthService, Database } from 'baraqex/server';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
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

// Create server instance
const server = createServer(config);

// Get Express app for additional middleware
const app = server.getExpressApp();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  const db = server.getDatabase();
  res.json({
    api: 'online',
    database: db ? 'connected' : 'not configured',
    authentication: server.getAuth() ? 'enabled' : 'disabled',
    timestamp: new Date().toISOString()
  });
});

// Enable SSR with hydration
server.enableSSR({ hydratable: true });

// Database connection
async function connectDatabase() {
  const db = server.getDatabase();
  if (db) {
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
  
  try {
    await server.stop();
    const db = server.getDatabase();
    if (db) {
      await db.disconnect();
    }
    console.log('✅ Server shut down complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  try {
    // Connect to database first
    await connectDatabase();
    
    // Start the server
    await server.start();
    
    console.log(`🚀 Fullstack server running on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 Auth: ${server.getAuth() ? 'enabled' : 'disabled'}`);
    console.log(`💾 Database: ${server.getDatabase() ? 'connected' : 'not configured'}`);
    console.log(`🌐 API docs: http://localhost:${config.port}/api-docs`);
    console.log(`❤️  Health check: http://localhost:${config.port}/health`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

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

export default server;
