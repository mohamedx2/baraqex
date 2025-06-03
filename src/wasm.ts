/**
 * WASM type definitions and utilities
 */

export interface GoWasmOptions {
  debug?: boolean;
  goWasmPath?: string;
  importObject?: Record<string, any>;
  onLoad?: (instance: GoWasmInstance) => void;
}

export interface GoWasmInstance {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  exports: WebAssembly.Instance['exports'];
  functions: Record<string, Function>;
}

// Browser-side WASM utilities
export async function loadGoWasm(
  wasmUrl: string,
  options: GoWasmOptions = {}
): Promise<GoWasmInstance> {
  if (typeof window === 'undefined') {
    throw new Error('loadGoWasm is for browser use only. Use loadGoWasmFromFile for Node.js');
  }
  
  try {
    // Load Go runtime
    const goScript = document.createElement('script');
    goScript.src = options.goWasmPath || '/wasm_exec.js';
    document.head.appendChild(goScript);
    
    await new Promise((resolve, reject) => {
      goScript.onload = resolve;
      goScript.onerror = reject;
    });
    
    // Initialize Go
    const go = new (window as any).Go();
    
    // Load WASM
    const wasmModule = await WebAssembly.instantiateStreaming(
      fetch(wasmUrl),
      { ...go.importObject, ...options.importObject }
    );
    
    // Run Go
    go.run(wasmModule.instance);
    
    // Extract functions
    const functions: Record<string, Function> = {};
    const exports = wasmModule.instance.exports;
    
    for (const key in exports) {
      if (typeof exports[key] === 'function') {
        functions[key] = exports[key] as Function;
      }
    }
    
    const instance: GoWasmInstance = {
      instance: wasmModule.instance,
      module: wasmModule.module,
      exports,
      functions
    };
    
    if (options.onLoad) {
      options.onLoad(instance);
    }
    
    return instance;
  } catch (error) {
    console.error('[WASM] Failed to load Go WASM module:', error);
    throw error;
  }
}

// Re-export server WASM functions for convenience
export { initNodeWasm, loadGoWasmFromFile } from './server/wasm.js';
