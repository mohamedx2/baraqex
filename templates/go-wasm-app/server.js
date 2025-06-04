import { createServer, loadGoWasmFromFile } from '../../dist/server/index.js';

const server = createServer({
  port: process.env.PORT || 3000,
  pagesDir: './src/pages',
  staticDir: './public',
  enableCors: true
});

server.enableSSR({ hydratable: true });

// Load WASM module on server startup
async function initializeWasm() {
  try {
    console.log('🔄 Loading Go WASM module...');
    await loadGoWasmFromFile('./public/app.wasm', {
      debug: true,
      goWasmPath: './public/wasm_exec.js'
    });
    console.log('✅ Go WASM module loaded successfully on server');
  } catch (error) {
    console.warn('⚠️ Could not load WASM on server:', error.message);
    console.log('💡 WASM will be loaded on the client side only');
  }
}

server.start().then(async () => {
  console.log('🚀 Baraqex Go WASM server started successfully!');
  console.log('📱 Visit http://localhost:3000 to see your app');
  
  // Initialize WASM after server starts
  await initializeWasm();
}).catch(error => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
