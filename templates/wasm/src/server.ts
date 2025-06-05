import { createServer } from 'frontend-hamroun';
import { loadGoWasmFromFile } from 'frontend-hamroun';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create server instance
const server = createServer({
  port: 3000,
  staticDir: './public',
  pagesDir: './src/pages',
  apiDir: './src/api'
});

// Server-side WASM integration example
async function initServerWasm() {
  try {
    console.log('🔄 Initializing server-side Go WASM...');
    
    const wasmPath = path.join(__dirname, '..', 'public', 'example.wasm');
    const wasmInstance = await loadGoWasmFromFile(wasmPath, {
      debug: true,
      onLoad: (instance) => {
        console.log('✅ Go WASM loaded on server side');
        
        // Test server-side WASM functions
        try {
          if (instance.functions.add) {
            const result = instance.functions.add(5, 3);
            console.log('Server WASM test - add(5, 3):', result);
          }
          
          if (instance.functions.fibonacci) {
            const fibResult = instance.functions.fibonacci(10);
            console.log('Server WASM test - fibonacci(10):', fibResult);
          }
        } catch (error) {
          console.log('Server WASM test functions not available:', error.message);
        }
      }
    });
    
    // Make WASM instance available to API routes
    server.getExpressApp().locals.wasm = wasmInstance;
    
  } catch (error) {
    console.error('❌ Failed to initialize server-side WASM:', error);
  }
}

// API route example using server-side WASM
server.getExpressApp().get('/api/wasm/compute', async (req, res) => {
  try {
    const { operation, a, b } = req.query;
    const wasmInstance = req.app.locals.wasm;
    
    if (!wasmInstance) {
      return res.status(500).json({ error: 'WASM not initialized' });
    }
    
    let result;
    switch (operation) {
      case 'add':
        if (wasmInstance.functions.add) {
          result = wasmInstance.functions.add(Number(a), Number(b));
        } else {
          throw new Error('Add function not available');
        }
        break;
      case 'fibonacci':
        if (wasmInstance.functions.fibonacci) {
          result = wasmInstance.functions.fibonacci(Number(a));
        } else {
          throw new Error('Fibonacci function not available');
        }
        break;
      default:
        throw new Error('Unknown operation');
    }
    
    res.json({
      success: true,
      operation,
      result,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
server.getExpressApp().get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    wasm: !!req.app.locals.wasm,
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  try {
    // Initialize WASM first
    await initServerWasm();
    
    // Start the server
    await server.start();
    
    console.log('🚀 Server started successfully!');
    console.log('📋 Available endpoints:');
    console.log('   • http://localhost:3000 - Main app');
    console.log('   • http://localhost:3000/api/health - Health check');
    console.log('   • http://localhost:3000/api/wasm/compute - WASM compute API');
    console.log('');
    console.log('💡 Example API calls:');
    console.log('   • /api/wasm/compute?operation=add&a=5&b=3');
    console.log('   • /api/wasm/compute?operation=fibonacci&a=10');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  await server.stop();
  process.exit(0);
});

// Start the server
startServer();
