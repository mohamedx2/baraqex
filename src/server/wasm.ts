/**
 * Server-side Go WASM integration for Node.js
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoWasmInstance, GoWasmOptions } from '../wasm';

// Global flag to ensure we only initialize WASM once
let initialized = false;

/**
 * Initialize the Node.js environment for running Go WASM modules
 */
export async function initNodeWasm(): Promise<void> {
  if (initialized) return;
  
  try {
    // Check if node requires WASM flags
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    
    // Node.js version check for WASM flags requirement
    if (majorVersion < 16) {
      console.warn(
        '[WASM] Note: Node.js version < 16 detected. ' +
        'You may need --experimental-wasm-bigint flag for Go WASM modules.'
      );
    }
    
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
 * Load a Go WASM module from a file path for server-side usage
 */
export async function loadGoWasmFromFile(
  wasmFilePath: string,
  options: GoWasmOptions = {}
): Promise<GoWasmInstance> {
  try {
    // Initialize Node.js WASM environment
    await initNodeWasm();
    
    // Create a proper Go runtime that matches what Go WASM expects
    const Go = class {
      importObject = {
        gojs: {
          // Memory management
          'runtime.wasmExit': (sp: number) => {
            const code = new DataView(this.mem.buffer).getInt32(sp + 8, true);
            process.exit(code);
          },
          'runtime.wasmWrite': (sp: number) => {
            const fd = new DataView(this.mem.buffer).getInt32(sp + 8, true);
            const p = new DataView(this.mem.buffer).getInt32(sp + 16, true);
            const n = new DataView(this.mem.buffer).getInt32(sp + 24, true);
            if (fd === 1) { // stdout
              process.stdout.write(new Uint8Array(this.mem.buffer, p, n));
            } else if (fd === 2) { // stderr
              process.stderr.write(new Uint8Array(this.mem.buffer, p, n));
            }
          },
          'runtime.resetMemoryDataView': () => {
            this.mem = this.inst?.exports.mem;
          },
          'runtime.nanotime1': (sp: number) => {
            const nsec = Date.now() * 1000000;
            new DataView(this.mem.buffer).setBigInt64(sp + 8, BigInt(nsec), true);
          },
          'runtime.walltime': (sp: number) => {
            const msec = Date.now();
            const sec = Math.floor(msec / 1000);
            const nsec = (msec % 1000) * 1000000;
            new DataView(this.mem.buffer).setBigInt64(sp + 8, BigInt(sec), true);
            new DataView(this.mem.buffer).setInt32(sp + 16, nsec, true);
          },
          'runtime.scheduleTimeoutEvent': (sp: number) => {
            const id = this._nextCallbackTimeoutID++;
            const delay = new DataView(this.mem.buffer).getBigInt64(sp + 8, true);
            setTimeout(() => {
              this._resume();
            }, Number(delay));
            new DataView(this.mem.buffer).setInt32(sp + 16, id, true);
          },
          'runtime.clearTimeoutEvent': (sp: number) => {
            // Simplified implementation
          },
          'runtime.getRandomData': (sp: number) => {
            const buf = new DataView(this.mem.buffer).getInt32(sp + 8, true);
            const len = new DataView(this.mem.buffer).getInt32(sp + 16, true);
            crypto.getRandomValues(new Uint8Array(this.mem.buffer, buf, len));
          },
          
          // JavaScript interop
          'syscall/js.finalizeRef': () => {},
          'syscall/js.stringVal': (sp: number) => {
            const s = this._loadString(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            this._storeValue(sp + 16, s);
          },
          'syscall/js.valueGet': (sp: number) => {
            try {
              const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
              const p = this._loadString(new DataView(this.mem.buffer).getInt32(sp + 16, true));
              
              // Ensure v is a valid object before using Reflect.get
              if (v === null || v === undefined) {
                console.warn(`[WASM] valueGet called on null/undefined object for property: ${p}`);
                this._storeValue(sp + 24, undefined);
                return;
              }
              
              if (typeof v !== 'object' && typeof v !== 'function') {
                console.warn(`[WASM] valueGet called on non-object (${typeof v}) for property: ${p}`);
                this._storeValue(sp + 24, undefined);
                return;
              }
              
              const result = Reflect.get(v, p);
              this._storeValue(sp + 24, result);
            } catch (error) {
              console.warn(`[WASM] Error in valueGet:`, error);
              this._storeValue(sp + 24, undefined);
            }
          },
          'syscall/js.valueSet': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const p = this._loadString(new DataView(this.mem.buffer).getInt32(sp + 16, true));
            const x = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 24, true));
            Reflect.set(v, p, x);
          },
          'syscall/js.valueDelete': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const p = this._loadString(new DataView(this.mem.buffer).getInt32(sp + 16, true));
            Reflect.deleteProperty(v, p);
          },
          'syscall/js.valueIndex': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const i = new DataView(this.mem.buffer).getInt32(sp + 16, true);
            this._storeValue(sp + 20, Reflect.get(v, i));
          },
          'syscall/js.valueSetIndex': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const i = new DataView(this.mem.buffer).getInt32(sp + 16, true);
            const x = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 20, true));
            Reflect.set(v, i, x);
          },
          'syscall/js.valueCall': (sp: number) => {
            try {
              const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
              const m = this._loadString(new DataView(this.mem.buffer).getInt32(sp + 16, true));
              const args = this._loadSliceOfValues(new DataView(this.mem.buffer).getInt32(sp + 24, true));
              const result = Reflect.apply(v[m], v, args);
              this._storeValue(sp + 40, result);
              new DataView(this.mem.buffer).setUint8(sp + 48, 1);
            } catch (err) {
              this._storeValue(sp + 40, err);
              new DataView(this.mem.buffer).setUint8(sp + 48, 0);
            }
          },
          'syscall/js.valueInvoke': (sp: number) => {
            try {
              const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
              const args = this._loadSliceOfValues(new DataView(this.mem.buffer).getInt32(sp + 16, true));
              const result = Reflect.apply(v, undefined, args);
              this._storeValue(sp + 32, result);
              new DataView(this.mem.buffer).setUint8(sp + 40, 1);
            } catch (err) {
              this._storeValue(sp + 32, err);
              new DataView(this.mem.buffer).setUint8(sp + 40, 0);
            }
          },
          'syscall/js.valueNew': (sp: number) => {
            try {
              const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
              const args = this._loadSliceOfValues(new DataView(this.mem.buffer).getInt32(sp + 16, true));
              const result = Reflect.construct(v, args);
              this._storeValue(sp + 32, result);
              new DataView(this.mem.buffer).setUint8(sp + 40, 1);
            } catch (err) {
              this._storeValue(sp + 32, err);
              new DataView(this.mem.buffer).setUint8(sp + 40, 0);
            }
          },
          'syscall/js.valueLength': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            new DataView(this.mem.buffer).setInt32(sp + 16, parseInt(v.length), true);
          },
          'syscall/js.valuePrepareString': (sp: number) => {
            const s = String(this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true)));
            const str = new TextEncoder().encode(s);
            this._storeValue(sp + 16, str);
            new DataView(this.mem.buffer).setInt32(sp + 24, str.length, true);
          },
          'syscall/js.valueLoadString': (sp: number) => {
            const str = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            new Uint8Array(this.mem.buffer, new DataView(this.mem.buffer).getInt32(sp + 16, true)).set(str);
          },
          'syscall/js.valueInstanceOf': (sp: number) => {
            const v = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const t = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 16, true));
            new DataView(this.mem.buffer).setUint8(sp + 24, v instanceof t ? 1 : 0);
          },
          'syscall/js.copyBytesToGo': (sp: number) => {
            const dst = new DataView(this.mem.buffer).getInt32(sp + 8, true);
            const src = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 16, true));
            new Uint8Array(this.mem.buffer, dst).set(src);
            new DataView(this.mem.buffer).setInt32(sp + 24, src.length, true);
          },
          'syscall/js.copyBytesToJS': (sp: number) => {
            const dst = this._loadValue(new DataView(this.mem.buffer).getInt32(sp + 8, true));
            const src = new DataView(this.mem.buffer).getInt32(sp + 16, true);
            const len = new DataView(this.mem.buffer).getInt32(sp + 24, true);
            dst.set(new Uint8Array(this.mem.buffer, src, len));
            new DataView(this.mem.buffer).setInt32(sp + 32, len, true);
          },
          
          // Debug functions
          'debug': (value: any) => {
            console.log('[Go WASM Debug]:', value);
          }
        }
      };
      
      _nextCallbackTimeoutID = 1;
      mem: any;
      inst: any;
      _values: any[] = [NaN, 0, null, true, false, global, this];
      _goRefCounts: number[] = [];
      _ids = new Map();
      _idPool: number[] = [];
      
      _storeValue(addr: number, v: any) {
        const nanHead = 0x7FF80000;
        if (typeof v === "number" && v !== 0) {
          if (isNaN(v)) {
            new DataView(this.mem.buffer).setUint32(addr + 4, nanHead, true);
            new DataView(this.mem.buffer).setUint32(addr, 0, true);
            return;
          }
          new DataView(this.mem.buffer).setFloat64(addr, v, true);
          return;
        }
        
        if (v === undefined) {
          new DataView(this.mem.buffer).setFloat64(addr, 0, true);
          return;
        }
        
        let id = this._ids.get(v);
        if (id === undefined) {
          id = this._idPool.pop();
          if (id === undefined) {
            id = this._values.length;
          }
          this._values[id] = v;
          this._goRefCounts[id] = 0;
          this._ids.set(v, id);
        }
        this._goRefCounts[id]++;
        let typeFlag = 0;
        switch (typeof v) {
          case "object":
            if (v !== null) {
              typeFlag = 1;
            }
            break;
          case "string":
            typeFlag = 2;
            break;
          case "symbol":
            typeFlag = 3;
            break;
          case "function":
            typeFlag = 4;
            break;
        }
        new DataView(this.mem.buffer).setUint32(addr + 4, nanHead | typeFlag, true);
        new DataView(this.mem.buffer).setUint32(addr, id, true);
      }
      
      _loadValue(addr: number) {
        try {
          // Validate address bounds
          if (addr < 0 || addr >= this.mem.buffer.byteLength - 8) {
            console.warn(`[WASM] Invalid _loadValue address: ${addr}`);
            return undefined;
          }
          
          const f = new DataView(this.mem.buffer).getFloat64(addr, true);
          if (f === 0) {
            return undefined;
          }
          if (!isNaN(f)) {
            return f;
          }
          
          const id = new DataView(this.mem.buffer).getUint32(addr, true);
          
          // Validate the ID is within bounds
          if (id < 0 || id >= this._values.length) {
            console.warn(`[WASM] Invalid value ID: ${id}, values length: ${this._values.length}`);
            return undefined;
          }
          
          return this._values[id];
        } catch (error) {
          console.warn(`[WASM] Error loading value at ${addr}:`, error);
          return undefined;
        }
      }
      
      _loadString(addr: number) {
        try {
          // Validate the address is within bounds
          if (addr < 0 || addr >= this.mem.buffer.byteLength - 8) {
            console.warn(`[WASM] Invalid string address: ${addr}, buffer size: ${this.mem.buffer.byteLength}`);
            return '';
          }
          
          const saddr = new DataView(this.mem.buffer).getInt32(addr + 0, true);
          const len = new DataView(this.mem.buffer).getInt32(addr + 8, true);
          
          // Validate string data address and length
          if (saddr < 0 || len < 0 || saddr + len > this.mem.buffer.byteLength) {
            console.warn(`[WASM] Invalid string data - addr: ${saddr}, len: ${len}, buffer size: ${this.mem.buffer.byteLength}`);
            return '';
          }
          
          return new TextDecoder("utf-8").decode(new DataView(this.mem.buffer, saddr, len));
        } catch (error) {
          console.warn(`[WASM] Error loading string at ${addr}:`, error);
          return '';
        }
      }
      
      _loadSliceOfValues(addr: number) {
        try {
          // Validate the address is within bounds
          if (addr < 0 || addr >= this.mem.buffer.byteLength - 16) {
            console.warn(`[WASM] Invalid slice address: ${addr}`);
            return [];
          }
          
          const array = new DataView(this.mem.buffer).getInt32(addr + 0, true);
          const len = new DataView(this.mem.buffer).getInt32(addr + 8, true);
          
          // Validate array parameters
          if (len < 0 || len > 1000) { // Reasonable limit
            console.warn(`[WASM] Invalid slice length: ${len}`);
            return [];
          }
          
          if (array < 0 || array + (len * 8) > this.mem.buffer.byteLength) {
            console.warn(`[WASM] Invalid slice data - addr: ${array}, len: ${len}`);
            return [];
          }
          
          const a = new Array(len);
          for (let i = 0; i < len; i++) {
            a[i] = this._loadValue(array + i * 8);
          }
          return a;
        } catch (error) {
          console.warn(`[WASM] Error loading slice at ${addr}:`, error);
          return [];
        }
      }
      
      _resume() {
        if (this.inst && this.inst.exports.resume) {
          try {
            (this.inst.exports.resume as Function)();
          } catch (error) {
            console.warn('[WASM] Error resuming:', error);
          }
        }
      }
      
      run(instance: WebAssembly.Instance) {
        this.inst = instance;
        this.mem = instance.exports.mem;
        
        // Set up the global object with common browser APIs
        global.global = global;
        global.Object = Object;
        global.Array = Array;
        global.console = console;
        global.document = {
          createElement: (tag: string) => ({ tagName: tag, innerHTML: '', style: {} } as any),
          getElementById: () => null,
          querySelector: () => null
        } as unknown as Document;
        global.window = global as any;
        
        // Add required crypto for Go WASM
        if (!global.crypto) {
          global.crypto = {
            getRandomValues: <T extends ArrayBufferView | null>(array: T): T => {
              if (array && array instanceof Uint8Array) {
                for (let i = 0; i < array.length; i++) {
                  array[i] = Math.floor(Math.random() * 256);
                }
              }
              return array;
            },
            subtle: {} as SubtleCrypto,
            randomUUID: () => {
              return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = Math.random() * 16 | 0;
                const v = c === 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
              });
            }
          } as Crypto;
        }
        
        if (options.debug) {
          console.log('[WASM] Go runtime initialized with proper imports');
          console.log('[WASM] Memory size:', this.mem.buffer.byteLength, 'bytes');
        }
        
        // Run the Go program with error handling
        try {
          if (instance.exports.run) {
            (instance.exports.run as Function)();
          }
        } catch (error) {
          console.error('[WASM] Error running Go program:', error);
          throw error;
        }
      }
    };
    
    // Load WASM binary
    const wasmBuffer = await fs.readFile(wasmFilePath);
    const wasmModule = await WebAssembly.compile(wasmBuffer);
    
    // Create Go instance
    const go = new Go();
    
    // Create imports object
    const finalImportObject = {
      ...go.importObject,
      ...options.importObject
    };
    
    // Instantiate the WASM module
    const instance = await WebAssembly.instantiate(wasmModule, finalImportObject);
    
    // Initialize Go runtime
    go.run(instance);
    
    // Give the Go module more time to register global functions and handle initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Extract exported functions
    const exports = instance.exports;
    const functions: Record<string, Function> = {};
    
    // Generate wrapper functions for all exports that are functions
    for (const key in exports) {
      if (typeof exports[key] === 'function') {
        const exportedFunc = exports[key] as unknown as Function;
        functions[key] = (...args: any[]) => exportedFunc(...args);
        
        if (options.debug) {
          const originalFn = functions[key];
          functions[key] = (...args: any[]) => {
            console.log(`[WASM] Calling ${key}(${args.join(', ')})`);
            const result = originalFn(...args);
            console.log(`[WASM] ${key} returned:`, result);
            return result;
          };
        }
      }
    }

    // Also capture global functions exported by Go
    for (const key in global) {
      if (key.startsWith('go') && typeof (global as any)[key] === 'function') {
        const globalFunc = (global as any)[key] as Function;
        functions[key] = (...args: any[]) => globalFunc(...args);
        
        if (options.debug) {
          const originalFn = functions[key];
          functions[key] = (...args: any[]) => {
            console.log(`[WASM] Calling global ${key}(${args.join(', ')})`);
            const result = originalFn(...args);
            console.log(`[WASM] ${key} returned:`, result);
            return result;
          };
        }
      }
    }
    
    const wasmInstance: GoWasmInstance = {
      instance,
      module: wasmModule,
      exports,
      functions
    };
    
    // Run onLoad callback if provided
    if (options.onLoad) {
      options.onLoad(wasmInstance);
    }
    
    return wasmInstance;
  } catch (error) {
    console.error('[WASM] Failed to load Go WASM module:', error);
    throw error;
  }
}
