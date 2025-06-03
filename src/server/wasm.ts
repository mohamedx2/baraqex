/**
 * Server-side Go WASM integration for Node.js
 * Uses the standard Go WASM runtime (wasm_exec.js)
 */
import fs from 'fs/promises';
import path from 'path';
import { pathToFileURL } from 'url';
import { GoWasmInstance, GoWasmOptions } from '../wasm.js';

// Global flag to ensure we only initialize WASM once
let initialized = false;

/**
 * Initialize the Node.js environment for running Go WASM modules
 */
export async function initNodeWasm(): Promise<void> {
  if (initialized) return;
  
  try {
    // Global WASM environment setup for Node.js
    globalThis.TextEncoder = globalThis.TextEncoder || TextEncoder;
    globalThis.TextDecoder = globalThis.TextDecoder || TextDecoder;
    
    // Mark as initialized
    initialized = true;
  } catch (error) {
    console.error('[WASM] Failed to initialize Node.js WASM environment:', error);
    throw error;
  }
}

/**
 * Load Go WASM runtime from wasm_exec.js file
 */
async function loadGoRuntime(goWasmPath?: string): Promise<any> {
  if (typeof global.Go === 'function') {
    return global.Go;
  }

  // Try to find wasm_exec.js or wasm_exec.cjs
  const possiblePaths = [
    goWasmPath,
    './wasm_exec.cjs',
    './wasm_exec.js',
    './public/wasm_exec.cjs',
    './public/wasm_exec.js',
    './src/wasm_exec.cjs',
    './src/wasm_exec.js',
    path.join(process.cwd(), 'wasm_exec.cjs'),
    path.join(process.cwd(), 'wasm_exec.js'),
    path.join(process.cwd(), 'public', 'wasm_exec.cjs'),
    path.join(process.cwd(), 'public', 'wasm_exec.js'),
    path.join(process.cwd(), 'src', 'wasm_exec.cjs'),
    path.join(process.cwd(), 'src', 'wasm_exec.js')
  ].filter(Boolean);

  for (const wasmExecPath of possiblePaths) {
    try {
      const resolvedPath = path.resolve(wasmExecPath!);
      
      // Check if file exists using fs.stat instead of fs.access
      try {
        const stats = await fs.stat(resolvedPath);
        if (!stats.isFile()) {
          continue;
        }
      } catch (statError) {
        continue; // File doesn't exist, try next path
      }
      
      // Load the Go runtime using dynamic import with file:// URL
      const wasmExecUrl = pathToFileURL(resolvedPath).href;
      
      // Clear global.Go to ensure fresh import
      if (global.Go) {
        delete (global as any).Go;
      }
      
      // Import the module
      await import(wasmExecUrl);
      
      if (typeof global.Go === 'function') {
        console.log(`[WASM] Loaded Go runtime from: ${resolvedPath}`);
        return global.Go;
      } else {
        console.warn(`[WASM] File found but Go class not exported: ${resolvedPath}`);
      }
    } catch (error: any) {
      console.warn(`[WASM] Error loading from ${wasmExecPath}:`, error.message);
      continue;
    }
  }

  throw new Error(
    '[WASM] Could not find wasm_exec.js. Please ensure you have the Go WASM runtime file available.\n' +
    'You can get it from: https://github.com/golang/go/blob/master/misc/wasm/wasm_exec.js\n' +
    `Searched paths: ${possiblePaths.join(', ')}`
  );
}

/**
 * Load a Go WASM module from a file path for server-side usage
 */
export async function loadGoWasmFromFile(
  wasmFilePath: string,
  options: GoWasmOptions = {}
): Promise<GoWasmInstance> {
  try {
    // Initialize Node.js WASM environment
    await initNodeWasm();
    
    if (options.debug) {
      console.log('[WASM] Loading WASM from file:', wasmFilePath);
    }

    // Load the standard Go runtime
    const GoRuntime = await loadGoRuntime(options.goWasmPath);
    const go = new GoRuntime();
    
    // Load WASM binary
    const wasmBuffer = await fs.readFile(wasmFilePath);
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    
    // The standard wasm_exec.js provides imports under 'go' but some Go WASM modules expect 'gojs'
    // Create imports object with both possible structures
    const baseImports = go.importObject;
    const finalImportObject = {
      ...baseImports,
      // Add gojs mapping for compatibility
      gojs: baseImports.go || {},
      ...options.importObject
    };
    
    if (options.debug) {
      console.log('[WASM] Available import modules:', Object.keys(finalImportObject));
      console.log('[WASM] Go import functions:', Object.keys(finalImportObject.go || {}));
      console.log('[WASM] Gojs import functions:', Object.keys(finalImportObject.gojs || {}));
    }
    
    // Instantiate the WASM module
    const instance = await WebAssembly.instantiate(wasmModule, finalImportObject);
    
    // Initialize Go runtime (exactly like browser)
    await go.run(instance);
    
    // Give Go runtime time to initialize and register functions (like browser version)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract exported functions from global scope (like browser version)
    const functions: Record<string, Function> = {};
    
    // Look for Go functions in global scope
    const globalObj = global as any;
    for (const key in globalObj) {
      if (typeof globalObj[key] === 'function' && key.startsWith('go')) {
        functions[key] = globalObj[key];
        if (options.debug) {
          console.log(`[WASM] Found function: ${key}`);
        }
      }
    }

    const wasmInstance: GoWasmInstance = {
      instance,
      module: wasmModule,
      exports: instance.exports,
      functions
    };
    
    // Run onLoad callback if provided
    if (options.onLoad) {
      options.onLoad(wasmInstance);
    }
    
    if (options.debug) {
      console.log(`[WASM] Module loaded successfully with ${Object.keys(functions).length} functions`);
    }
    
    return wasmInstance;
  } catch (error) {
    console.error('[WASM] Failed to load Go WASM module:', error);
    throw error;
  }
}

/**
 * Call a Go WASM function in Node.js environment
 */
export function callWasmFunction(funcName: string, ...args: any[]): any {
  const func = (global as any)[funcName];
  if (typeof func !== 'function') {
    throw new Error(`Function ${funcName} not found. Make sure the WASM module is loaded.`);
  }
  
  return func(...args);
}

/**
 * Check if Go WASM is ready in Node.js
 */
export function isWasmReady(): boolean {
  const globalObj = global as any;
  return Object.keys(globalObj).some(key => 
    key.startsWith('go') && typeof globalObj[key] === 'function'
  );
}

/**
 * Get all available Go WASM functions in Node.js
 */
export function getWasmFunctions(): string[] {
  const globalObj = global as any;
  return Object.keys(globalObj).filter(key => 
    key.startsWith('go') && typeof globalObj[key] === 'function'
  );
}

// Extend global for Go runtime
declare global {
  var Go: new () => {
    importObject: any;
    run: (instance: WebAssembly.Instance) => void;
  };
}

export type { GoWasmInstance, GoWasmOptions };
