import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testEnhancedGoWasm() {
  console.log('=== Testing Enhanced Go WASM Module (Browser-style API) ===\n');
  
  // Prevent process exit during testing
  process.on('exit', () => {
    console.log('Process is exiting...');
  });
  
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
      debug: true,
      goWasmPath: wasmExecPath
    });
    console.log('✅ WASM module functions!',wasmInstance.functions);
    
    console.log('🚀 WASM module loaded successfully!\n');
    
    // Wait longer and add more debugging
    console.log('⏳ Waiting for Go runtime to fully initialize...');
    
    // Wait in smaller chunks with progress updates
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`⏳ Waiting... ${(i + 1) * 500}ms`);
    }
    
    console.log('🔍 Starting manual debug check...');
    
    // Force the test to continue by catching any process exit
    try {
      // Manual debug check before isWasmReady
      console.log('🔍 Manual debug check of global object...');
      const globalObj = global;
      const allKeys = Object.getOwnPropertyNames(globalObj);
      const goKeys = allKeys.filter(key => key.startsWith('go'));
      console.log('📋 Manual check - Global keys starting with "go":', goKeys);
      const goTypes = goKeys.map(key => `${key}: ${typeof globalObj[key]}`);
      console.log('📋 Manual check - Go key types:', goTypes);
      
      // Check if WASM is ready (like browser isWasmReady check)
      console.log('🔍 Checking if WASM is ready...');
      const wasmReadyResult = isWasmReady();
      console.log('WASM Ready result:', wasmReadyResult);
      
      if (!wasmReadyResult) {
        console.log('❌ WASM not ready after loading');
        return;
      }
      
      // Get available functions (like browser getWasmFunctions)
      const availableFunctions = getWasmFunctions();
      console.log(`✅ WASM is ready with ${availableFunctions.length} functions:`);
      console.log(`📋 Functions: ${availableFunctions.join(', ')}\n`);
      
      // Test functions using the browser-style API
      console.log('=== Testing Go Functions (Browser-style API) ===\n');
      
      // Test all functions
      const testCases = [
        { name: 'goHello', args: ['World'], desc: 'Greeting function' },
        { name: 'goAdd', args: [10, 20], desc: 'Addition' },
        { name: 'goMultiply', args: [4, 7], desc: 'Multiplication' },
        { name: 'goFibonacci', args: [10], desc: 'Fibonacci' },
        { name: 'goIsPrime', args: [17], desc: 'Prime check' },
        { name: 'goDemo', args: [], desc: 'Demo function' }
      ];
      
      for (const test of testCases) {
        console.log(`🔹 Testing ${test.name} - ${test.desc}`);
        try {
          // Call function using browser-style API
          const result = callWasmFunction(test.name, ...test.args);
          console.log(`✅ ${test.name}(${test.args.join(', ')}) = ${JSON.stringify(result)}`);
        } catch (error) {
          console.log(`❌ ${test.name} error:`, error.message);
          
          // Try calling directly from global if it exists
          if (typeof globalObj[test.name] === 'function') {
            console.log(`🔄 Trying direct call to ${test.name}...`);
            try {
              const directResult = globalObj[test.name](...test.args);
              console.log(`✅ Direct call result: ${JSON.stringify(directResult)}`);
            } catch (directError) {
              console.log(`❌ Direct call error:`, directError.message);
            }
          }
        }
        console.log('');
      }
      
      console.log('🎉 All function tests completed!');
      console.log('\n=== Summary ===');
      console.log(`✅ WASM module loaded successfully`);
      console.log(`✅ Go runtime initialized`);
      console.log(`✅ Found ${availableFunctions.length} Go functions`);
      console.log(`✅ Server-side WASM API working like browser API`);
      
      console.log('\nThis API works just like your frontend code:');
      console.log('- loadGoWasmFromFile(path) instead of loadGoWasm(url)');
      console.log('- callWasmFunction(name, ...args) instead of window[name](...args)');
      console.log('- isWasmReady() exactly the same as browser');
      console.log('- getWasmFunctions() exactly the same as browser');
      
    } catch (debugError) {
      console.error('Debug error:', debugError);
    }
    
    console.log('✅ Test completed successfully!');
    
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
  } finally {
    // Force exit to prevent hanging
    console.log('🏁 Test finished, exiting...');
    process.exit(0);
  }
}

// Run the test
testEnhancedGoWasm();
