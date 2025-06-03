// Use the local built version instead of npm package
import * as baraqex from '../dist/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the re-exported functionality
console.log('Testing baraqex package (local build)...');
console.log('All available exports:');
Object.keys(baraqex).forEach((key, index) => {
  console.log(`  ${index + 1}. ${key}: ${typeof baraqex[key]}`);
});

// Test frontend-hamroun exports
console.log('\n=== Frontend Hamroun Features ===');
console.log('render function:', typeof baraqex.render);
console.log('useState function:', typeof baraqex.useState);
console.log('useEffect function:', typeof baraqex.useEffect);
console.log('createContext function:', typeof baraqex.createContext);

// Test server utilities that are actually exported
console.log('\n=== Server Utilities ===');
console.log('generateDocument function:', typeof baraqex.generateDocument);
console.log('generateToken function:', typeof baraqex.generateToken);
console.log('hashString function:', typeof baraqex.hashString);
console.log('sendSuccess function:', typeof baraqex.sendSuccess);
console.log('baraqexRenderToString function:', typeof baraqex.baraqexRenderToString);
console.log('requestLogger function:', typeof baraqex.requestLogger);

// Test WASM functionality
console.log('\n=== WASM Utilities ===');
console.log('initNodeWasm function:', typeof baraqex.initNodeWasm);
console.log('loadGoWasmFromFile function:', typeof baraqex.loadGoWasmFromFile);
console.log('loadGoWasm function:', typeof baraqex.loadGoWasm);

// Test some functionality
console.log('\n=== Testing Functions ===');
try {
  if (baraqex.generateToken) {
    const token = baraqex.generateToken(16);
    console.log('Generated token length:', token.length);
  }
  
  if (baraqex.hashString) {
    const hash = baraqex.hashString('test', 'salt');
    console.log('Hash generated:', hash.length === 64 ? '✅' : '❌');
  }
  
  if (baraqex.generateDocument) {
    const doc = baraqex.generateDocument('<h1>Test</h1>', { title: 'Test Page' });
    console.log('Document generated:', doc.includes('<!DOCTYPE html>') ? '✅' : '❌');
  }
  
  // Test WASM initialization and loading
  if (baraqex.initNodeWasm && baraqex.loadGoWasmFromFile) {
    console.log('\n=== Testing Go WASM Module ===');
    try {
      await baraqex.initNodeWasm();
      console.log('✅ WASM environment initialized successfully');
      
      // Load the example.wasm file
      const wasmPath = path.join(__dirname, 'example.wasm');
      console.log(`Attempting to load WASM file: ${wasmPath}`);
      
      // Check if file exists and get its size
      const fs = await import('fs/promises');
      const stats = await fs.stat(wasmPath);
      console.log(`WASM file size: ${stats.size} bytes`);
      
      const wasmInstance = await baraqex.loadGoWasmFromFile(wasmPath, {
        debug: true,
        onLoad: (instance) => {
          console.log('🚀 WASM module loaded successfully!');
          console.log('Available functions:', Object.keys(instance.functions));
          console.log('Module memory:', instance.instance.exports.mem ? 'Available' : 'Not available');
        }
      });
      
      console.log('✅ WASM module loaded successfully');
      console.log('Module exports:', Object.keys(wasmInstance.exports));
      console.log('Available Go functions:', Object.keys(wasmInstance.functions));
      
      // Test Go functions if they're available globally
      console.log('\n=== Testing Go Functions ===');
      
      // Wait longer for functions to be registered
      console.log('Waiting for Go functions to be registered...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // List all global functions that start with 'go'
      console.log('\n=== All Global Go Functions ===');
      const goFunctions = Object.keys(global).filter(key => 
        key.startsWith('go') && typeof (global )[key] === 'function'
      );
      console.log('Found Go functions:', goFunctions);
      
      if (goFunctions.length === 0) {
        console.log('⚠️ No Go functions found in global scope');
        console.log('This might indicate the Go WASM module needs more time to initialize');
        
        // Try accessing functions through instance exports
        console.log('\n=== Checking WASM exports directly ===');
        const exports = wasmInstance.exports;
        Object.keys(exports).forEach(key => {
          console.log(`Export: ${key} - ${typeof exports[key]}`);
        });
      } else {
        // Test available functions
        for (const funcName of goFunctions) {
          try {
            console.log(`\n--- Testing ${funcName} ---`);
            
            switch (funcName) {
              case 'goHello':
                const greeting = (global)[funcName]('Baraqex');
                console.log(`✅ ${funcName}("Baraqex"):`, greeting);
                break;
              case 'goAdd':
                const sum = (global )[funcName](10, 20);
                console.log(`✅ ${funcName}(10, 20):`, sum);
                break;
              case 'goMultiply':
                const product = (global )[funcName](7, 8);
                console.log(`✅ ${funcName}(7, 8):`, product);
                break;
              case 'goFibonacci':
                const fib = (global )[funcName](10);
                console.log(`✅ ${funcName}(10):`, fib);
                break;
              case 'goIsPrime':
                const isPrime = (global )[funcName](17);
                console.log(`✅ ${funcName}(17):`, isPrime);
                break;
              case 'goCalculatePI':
                const pi = (global )[funcName](1000);
                console.log(`✅ ${funcName}(1000):`, pi);
                break;
              default:
                console.log(`ℹ️ ${funcName} available but not tested`);
                break;
            }
          } catch (error) {
            console.log(`❌ ${funcName} error:`, error.message);
          }
        }
      }
      
    } catch (error) {
      console.log('❌ WASM loading failed:', error.message);
      console.log('This could be due to:');
      console.log('1. WASM file not found or corrupted');
      console.log('2. Go runtime compatibility issues');
      console.log('3. Memory layout incompatibility');
      console.log('4. Missing Go runtime dependencies');
    }
  }
  
  // Test browser WASM function (should fail in Node.js)
  if (baraqex.loadGoWasm) {
    console.log('\n=== Testing Browser WASM Function ===');
    try {
      await baraqex.loadGoWasm('/test.wasm');
    } catch (error) {
      console.log('✅ Browser-only WASM function correctly throws in Node.js:', error.message);
    }
  }
  
} catch (error) {
  console.log('❌ Error testing functions:', error.message);
}

// Final check
const frontendFunctions = ['render', 'useState', 'useEffect'].filter(fn => typeof baraqex[fn] === 'function');
const utilityFunctions = ['generateDocument', 'generateToken', 'hashString'].filter(fn => typeof baraqex[fn] === 'function');
const wasmFunctions = ['initNodeWasm', 'loadGoWasmFromFile', 'loadGoWasm'].filter(fn => typeof baraqex[fn] === 'function');

console.log('\n=== Summary ===');
console.log(`✅ Frontend functions available: ${frontendFunctions.length}/3`);
console.log(`✅ Utility functions available: ${utilityFunctions.length}/3`);
console.log(`✅ WASM functions available: ${wasmFunctions.length}/3`);
console.log(`📦 Total exports: ${Object.keys(baraqex).length}`);

if (frontendFunctions.length >= 3 && utilityFunctions.length >= 3 && wasmFunctions.length >= 3) {
  console.log('🎉 Baraqex package with Go WASM support working correctly!');
} else {
  console.log('⚠️  Some functionality may be missing');
  console.log('Missing frontend:', ['render', 'useState', 'useEffect'].filter(fn => typeof baraqex[fn] !== 'function'));
  console.log('Missing utilities:', ['generateDocument', 'generateToken', 'hashString'].filter(fn => typeof baraqex[fn] !== 'function'));
  console.log('Missing WASM:', ['initNodeWasm', 'loadGoWasmFromFile', 'loadGoWasm'].filter(fn => typeof baraqex[fn] !== 'function'));
}