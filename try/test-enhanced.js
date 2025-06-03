import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEnhancedGoWasm() {
  console.log('=== Testing Enhanced Go WASM Module (Browser-style API) ===\n');
  
  try {
    // Check if wasm_exec.cjs exists first
    const wasmExecPath = path.join(__dirname, 'wasm_exec.cjs');
    console.log(`Checking for wasm_exec.cjs at: ${wasmExecPath}`);
    
    try {
      const stats = fs.statSync(wasmExecPath);
      console.log(`✅ wasm_exec.cjs found! Size: ${stats.size} bytes`);
    } catch (error) {
      console.error(`❌ wasm_exec.cjs not found at: ${wasmExecPath}`);
      console.log('Current directory contents:');
      const files = fs.readdirSync(__dirname);
      files.forEach(file => console.log(`  - ${file}`));
      return;
    }

    // Import the compiled WASM loader from dist folder
    const { loadGoWasmFromFile, callWasmFunction, isWasmReady, getWasmFunctions } = 
      await import('../dist/server/wasm.js');
    
    // Load the WASM module (like browser fetch + instantiate)
    const wasmPath = path.join(__dirname, 'example.wasm');
    
    console.log(`Loading WASM from: ${wasmPath}`);
    console.log(`Using Go runtime from: ${wasmExecPath}`);
    
    const wasmInstance = await loadGoWasmFromFile(wasmPath, {
      debug: true, // Enable debug to see what's happening
      goWasmPath: wasmExecPath // Specify the path to wasm_exec.cjs
    });
    
    console.log('🚀 WASM module loaded successfully!\n');
    
    // Check if WASM is ready (like browser isWasmReady check)
    if (!isWasmReady()) {
      console.log('❌ WASM not ready after loading');
      return;
    }
    
    // Get available functions (like browser getWasmFunctions)
    const availableFunctions = getWasmFunctions();
    console.log(`✅ WASM is ready with ${availableFunctions.length} functions:`);
    console.log(`📋 Functions: ${availableFunctions.join(', ')}\n`);
    
    // Test functions using the browser-style API
    console.log('=== Testing Go Functions (Browser-style API) ===\n');
    
    // Test just one function first
    console.log(`🔹 Testing goHello - Greeting function`);
    try {
      // Call function using browser-style API
      const result = callWasmFunction('goHello', 'World');
      console.log(`✅ goHello('World') = ${JSON.stringify(result)}`);
    } catch (error) {
      console.log(`❌ goHello error:`, error.message);
    }
    console.log('');
    
    console.log('🎉 Single function test completed!');
    console.log('\nThis API works just like your frontend code:');
    console.log('- loadGoWasm(url) instead of fetch + instantiate');
    console.log('- callWasmFunction(name, ...args) instead of window[name](...args)');
    console.log('- isWasmReady() instead of wasmReady state');
    console.log('- getWasmFunctions() to list available functions');
    
  } catch (error) {
    console.error('❌ Error testing browser-style WASM API:', error);
    
    if (error.message && error.message.includes('wasm_exec.js')) {
      console.log('\n📝 Make sure wasm_exec.js exists in the try folder:');
      console.log('   The file should be at: C:\\Users\\hamro\\Documents\\work\\baraqex\\try\\wasm_exec.js');
      console.log('   You can verify it exists with: dir wasm_exec.js');
    }
    
    if (error.code === 'ERR_MODULE_NOT_FOUND') {
      console.log('\n📝 Note: Make sure to build the project first:');
      console.log('   npm run build');
      console.log('   Then run this test again.');
    }
  }
}

// Run the test
testEnhancedGoWasm();
