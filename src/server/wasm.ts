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
    
    // The updated wasm_exec.js provides imports under 'gojs' instead of 'go'
    // Create imports object with the correct structure
    const baseImports = go.importObject;
    const finalImportObject = {
      ...baseImports,
      ...options.importObject
    };
    
    if (options.debug) {
      console.log('[WASM] Available import modules:', Object.keys(finalImportObject));
      
      // Debug each module's functions
      for (const [moduleName, moduleExports] of Object.entries(finalImportObject)) {
        if (typeof moduleExports === 'object' && moduleExports !== null) {
          const exportNames = Object.keys(moduleExports);
          console.log(`[WASM] ${moduleName} import functions:`, exportNames);
        }
      }
    }
    
    // Instantiate the WASM module
    const instance = await WebAssembly.instantiate(wasmModule, finalImportObject);
    
    if (options.debug) {
      console.log('[WASM] WASM instance created, starting Go runtime...');
    }
    
    // Initialize Go runtime - this will run the main function
    // The go.run() method returns a promise that resolves when the program exits
    const runPromise = go.run(instance);
    
    if (options.debug) {
      console.log('[WASM] Go runtime started, waiting for initialization...');
    }
    
    // Give Go runtime time to initialize and register functions
    // Don't wait for the program to finish, just wait for functions to be registered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (options.debug) {
      console.log('[WASM] Scanning global object for Go functions...');
    }
    
    // Extract exported functions from global scope
    const functions: Record<string, Function> = {};
    const globalObj = global as any;
    
    // Scan for Go functions
    const allKeys = Object.getOwnPropertyNames(globalObj);
    const goKeys = allKeys.filter(key => key.startsWith('go'));
    
    if (options.debug) {
      console.log('[WASM] All keys starting with "go":', goKeys);
    }
    
    for (const key of goKeys) {
      if (typeof globalObj[key] === 'function') {
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
      console.log('[WASM] Final function list:', Object.keys(functions));
    }
    
    // Don't await the runPromise - let the Go program finish in the background
    // The functions are already registered and available
    runPromise.catch((error:any)=> {
      if (options.debug) {
        console.log('[WASM] Go program finished with error:', error);
      }
    });
    
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
