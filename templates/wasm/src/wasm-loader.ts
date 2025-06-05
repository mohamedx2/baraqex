/**
 * Browser-only WASM loader for the WASM template
 * This is a simplified version that works in the browser without server dependencies
 */

export interface WasmOptions {
  debug?: boolean;
  onLoad?: () => void;
}

let wasmReady = false;
let wasmError: string | null = null;

/**
 * Load Go WASM module in the browser
 */
export async function loadGoWasm(wasmPath: string, options: WasmOptions = {}): Promise<void> {
  if (wasmReady) return;
  
  try {
    if (options.debug) {
      console.log('[WASM] Loading WASM from:', wasmPath);
    }

    // Check if Go runtime is available
    if (typeof (window as any).Go !== 'function') {
      throw new Error('Go WASM runtime not found. Make sure wasm_exec.js is loaded.');
    }

    // Create Go instance
    const go = new (window as any).Go();
    
    if (options.debug) {
      console.log('[WASM] Go runtime created, loading WASM binary...');
    }
    
    // Load WASM binary
    const response = await fetch(wasmPath);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM file: ${response.status} ${response.statusText}`);
    }
    
    const wasmBytes = await response.arrayBuffer();
    const wasmModule = await WebAssembly.instantiate(wasmBytes, go.importObject);
    
    if (options.debug) {
      console.log('[WASM] WASM module instantiated, starting Go runtime...');
    }
    
    // Start Go runtime (this runs main() function)
    go.run(wasmModule.instance);
    
    // Give Go time to initialize and register functions
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (options.debug) {
      console.log('[WASM] Scanning for Go functions...');
      const goFunctions = Object.keys(window as any).filter(key => 
        key.startsWith('go') && typeof (window as any)[key] === 'function'
      );
      console.log('[WASM] Available functions:', goFunctions);
    }
    
    wasmReady = true;
    wasmError = null;
    
    if (options.onLoad) {
      options.onLoad();
    }
    
    if (options.debug) {
      console.log('[WASM] Go WASM loaded successfully!');
    }
    
  } catch (error) {
    wasmError = error instanceof Error ? error.message : 'Unknown WASM loading error';
    console.error('[WASM] Failed to load:', error);
    throw error;
  }
}

/**
 * Call a Go WASM function in the browser
 */
export function callWasmFunction(funcName: string, ...args: any[]): any {
  if (!wasmReady) {
    throw new Error('WASM not ready. Call loadGoWasm() first.');
  }
  
  const func = (window as any)[funcName];
  if (typeof func !== 'function') {
    throw new Error(`Function ${funcName} not found. Available functions: ${getWasmFunctions().join(', ')}`);
  }
  
  return func(...args);
}

/**
 * Check if WASM is ready
 */
export function isWasmReady(): boolean {
  return wasmReady;
}

/**
 * Get all available Go WASM functions
 */
export function getWasmFunctions(): string[] {
  return Object.keys(window as any).filter(key => 
    key.startsWith('go') && typeof (window as any)[key] === 'function'
  );
}

/**
 * Get WASM loading error if any
 */
export function getWasmError(): string | null {
  return wasmError;
}
