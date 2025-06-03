/**
 * WebAssembly integration for Frontend Hamroun
 * Works in both browser and Node.js environments
 */

export interface GoWasmOptions {
  debug?: boolean;
  goWasmPath?: string;
  importObject?: any;
  onLoad?: (instance: GoWasmInstance) => void;
}

export interface GoWasmInstance {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  exports: WebAssembly.Exports;
  functions: Record<string, Function>;
}

/**
 * Load Go WASM module in the browser (like your working frontend code)
 */
export async function loadGoWasm(
  wasmUrl: string,
  options: GoWasmOptions = {}
): Promise<GoWasmInstance> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoWasm() is for browser use only. Use loadGoWasmFromFile() in Node.js.');
  }

  try {
    // Check if Go WASM runtime is available (like your frontend code)
    if (!window.Go) {
      throw new Error('Go WASM runtime not available. Make sure wasm_exec.js is loaded.');
    }

    if (options.debug) {
      console.log('[WASM] Loading WASM from:', wasmUrl);
    }

    // Fetch the WASM file (exactly like your frontend code)
    const response = await fetch(wasmUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM file: ${response.status}`);
    }

    const wasmBytes = await response.arrayBuffer();
    
    // Initialize Go runtime (exactly like your frontend code)
    const go = new window.Go();
    const wasmModule = await WebAssembly.instantiate(wasmBytes, go.importObject);
    
    // Run the Go program (exactly like your frontend code)
    go.run(wasmModule.instance);
    
    // Wait a bit for Go functions to be registered (like your frontend code)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (options.debug) {
      console.log('[WASM] Go program started, checking for registered functions...');
    }

    // Extract exported functions from global scope (like your frontend code)
    const functions: Record<string, Function> = {};
    
    // Look for Go functions in global scope
    for (const key in window) {
      if (typeof window[key] === 'function' && key.startsWith('go')) {
        functions[key] = window[key] as Function;
        if (options.debug) {
          console.log(`[WASM] Found function: ${key}`);
        }
      }
    }

    const wasmInstance: GoWasmInstance = {
      instance: wasmModule.instance,
      module: wasmModule,
      exports: wasmModule.instance.exports,
      functions
    };

    if (options.onLoad) {
      options.onLoad(wasmInstance);
    }

    if (options.debug) {
      console.log(`[WASM] Module loaded successfully with ${Object.keys(functions).length} functions`);
    }

    return wasmInstance;

  } catch (error) {
    console.error('[WASM] Error loading Go WASM module:', error);
    throw error;
  }
}

/**
 * Call a Go WASM function (like your frontend code's callWasmFunction)
 */
export function callWasmFunction(funcName: string, ...args: any[]): any {
  if (typeof window === 'undefined') {
    throw new Error('callWasmFunction() is for browser use only.');
  }

  const func = (window as any)[funcName];
  if (typeof func !== 'function') {
    throw new Error(`Function ${funcName} not found. Make sure the WASM module is loaded.`);
  }
  
  return func(...args);
}

/**
 * Check if Go WASM is ready (like your frontend code's wasmReady state)
 */
export function isWasmReady(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if Go runtime is available and at least one Go function exists
  return !!(window.Go && Object.keys(window).some(key => 
    key.startsWith('go') && typeof window[key] === 'function'
  ));
}

/**
 * Get all available Go WASM functions
 */
export function getWasmFunctions(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }

  return Object.keys(window).filter(key => 
    key.startsWith('go') && typeof window[key] === 'function'
  );
}

/**
 * Hook for React components (like your frontend code's useEffect pattern)
 */
export function useGoWasm(wasmUrl: string, options: GoWasmOptions = {}) {
  if (typeof window === 'undefined') {
    throw new Error('useGoWasm() is for browser use only.');
  }

  // This would need to be implemented as a React hook in frontend-hamroun
  // For now, return the basic functionality
  return {
    loadWasm: () => loadGoWasm(wasmUrl, options),
    callFunction: callWasmFunction,
    isReady: isWasmReady,
    getFunctions: getWasmFunctions
  };
}

// Browser-specific type declarations
declare global {
  interface Window {
    Go: new () => {
      importObject: any;
      run: (instance: WebAssembly.Instance) => void;
    };
    [key: string]: any;
  }
}
