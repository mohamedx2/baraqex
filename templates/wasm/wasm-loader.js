/**
 * WASM Loader for Frontend Hamroun Go WASM integration
 */

let wasmInstance = null;
let wasmReady = false;

export async function loadGoWasm(wasmPath, options = {}) {
  if (wasmReady) {
    return wasmInstance;
  }

  try {
    console.log('🔄 Loading Go WASM module from:', wasmPath);

    // Load the Go WASM runtime
    if (!window.Go) {
      await loadWasmExecJs();
    }

    // Create Go instance
    const go = new window.Go();
    
    // Fetch and instantiate WASM
    const wasmModule = await WebAssembly.instantiateStreaming(
      fetch(wasmPath),
      go.importObject
    );

    // Run the Go program
    go.run(wasmModule.instance);

    wasmInstance = {
      instance: wasmModule.instance,
      module: wasmModule.module,
      go: go
    };

    wasmReady = true;
    
    console.log('✅ Go WASM module loaded successfully!');
    
    if (options.onLoad) {
      options.onLoad(wasmInstance);
    }

    return wasmInstance;
    
  } catch (error) {
    console.error('❌ Failed to load Go WASM module:', error);
    throw error;
  }
}

async function loadWasmExecJs() {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/wasm_exec.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load wasm_exec.js'));
    document.head.appendChild(script);
  });
}

export function isWasmReady() {
  return wasmReady;
}

export function getWasmInstance() {
  return wasmInstance;
}

// Utility functions for calling Go functions safely
export function callGoFunction(functionName, ...args) {
  if (!wasmReady) {
    throw new Error('WASM module not ready');
  }
  
  if (typeof window[functionName] !== 'function') {
    throw new Error(`Go function '${functionName}' not found`);
  }
  
  return window[functionName](...args);
}

export async function waitForWasm(timeout = 10000) {
  if (wasmReady) return wasmInstance;
  
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (wasmReady) {
        clearInterval(checkInterval);
        clearTimeout(timeoutId);
        resolve(wasmInstance);
      }
    }, 100);
    
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('WASM loading timeout'));
    }, timeout);
  });
}
