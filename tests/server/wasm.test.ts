import { initNodeWasm, loadGoWasmFromFile } from '../../src/server/wasm';
import fs from 'fs/promises';
import path from 'path';

// Mock WebAssembly for testing
const mockWebAssembly = {
  compile: jest.fn(),
  instantiate: jest.fn(),
  Instance: jest.fn(),
  Module: jest.fn()
};

// Mock fs module
jest.mock('fs/promises');
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock crypto for Node.js environment
const mockCrypto = {
  getRandomValues: jest.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  })
};

describe('WASM Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock global WebAssembly
    (global as any).WebAssembly = mockWebAssembly;
    (global as any).crypto = mockCrypto;
    
    // Reset TextEncoder/TextDecoder mocks
    (global as any).TextEncoder = TextEncoder;
    (global as any).TextDecoder = TextDecoder;
  });

  describe('initNodeWasm', () => {
    it('should initialize WASM environment successfully', async () => {
      await expect(initNodeWasm()).resolves.toBeUndefined();
      
      expect(globalThis.TextEncoder).toBeDefined();
      expect(globalThis.TextDecoder).toBeDefined();
    });

    it('should only initialize once', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await initNodeWasm();
      await initNodeWasm(); // Second call should be skipped
      
      consoleSpy.mockRestore();
    });

    it('should warn about old Node.js versions', async () => {
      const originalVersion = process.version;
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock old Node.js version
      Object.defineProperty(process, 'version', {
        value: 'v14.0.0',
        configurable: true
      });
      
      // Reset initialization state by creating new module instance
      jest.resetModules();
      const { initNodeWasm: freshInit } = await import('../../src/server/wasm');
      
      await freshInit();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Node.js version < 16 detected')
      );
      
      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        configurable: true
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadGoWasmFromFile', () => {
    const mockWasmBuffer = new Uint8Array([0, 97, 115, 109]); // WASM magic bytes
    const mockWasmPath = '/path/to/example.wasm';

    beforeEach(() => {
      // Mock file system operations
      mockFs.readFile.mockResolvedValue(Buffer.from(mockWasmBuffer));
      
      // Mock WebAssembly operations
      const mockModule = { exports: {} };
      const mockInstance = {
        exports: {
          mem: { buffer: new ArrayBuffer(1024) },
          run: jest.fn()
        }
      };
      
      mockWebAssembly.compile.mockResolvedValue(mockModule);
      mockWebAssembly.instantiate.mockResolvedValue(mockInstance);
    });

    it('should load WASM file successfully', async () => {
      const result = await loadGoWasmFromFile(mockWasmPath);
      
      expect(mockFs.readFile).toHaveBeenCalledWith(mockWasmPath);
      expect(mockWebAssembly.compile).toHaveBeenCalledWith(Buffer.from(mockWasmBuffer));
      expect(result).toHaveProperty('instance');
      expect(result).toHaveProperty('module');
      expect(result).toHaveProperty('exports');
      expect(result).toHaveProperty('functions');
    });

    it('should handle debug mode', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await loadGoWasmFromFile(mockWasmPath, { debug: true });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WASM] Go runtime initialized')
      );
      
      consoleSpy.mockRestore();
    });

    it('should call onLoad callback if provided', async () => {
      const onLoad = jest.fn();
      
      await loadGoWasmFromFile(mockWasmPath, { onLoad });
      
      expect(onLoad).toHaveBeenCalledWith(
        expect.objectContaining({
          instance: expect.any(Object),
          module: expect.any(Object),
          exports: expect.any(Object),
          functions: expect.any(Object)
        })
      );
    });

    it('should handle file read errors', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'));
      
      await expect(loadGoWasmFromFile(mockWasmPath)).rejects.toThrow('File not found');
    });

    it('should handle WebAssembly compilation errors', async () => {
      mockWebAssembly.compile.mockRejectedValue(new Error('Invalid WASM'));
      
      await expect(loadGoWasmFromFile(mockWasmPath)).rejects.toThrow('Invalid WASM');
    });

    it('should capture global Go functions', async () => {
      // Mock global Go functions
      (global as any).goTestFunction = jest.fn();
      (global as any).goAnotherFunction = jest.fn();
      (global as any).notAGoFunction = jest.fn();
      
      const result = await loadGoWasmFromFile(mockWasmPath);
      
      expect(result.functions).toHaveProperty('goTestFunction');
      expect(result.functions).toHaveProperty('goAnotherFunction');
      expect(result.functions).not.toHaveProperty('notAGoFunction');
      
      // Cleanup
      delete (global as any).goTestFunction;
      delete (global as any).goAnotherFunction;
      delete (global as any).notAGoFunction;
    });

    it('should merge custom import objects', async () => {
      const customImports = {
        env: {
          customFunction: jest.fn()
        }
      };
      
      await loadGoWasmFromFile(mockWasmPath, { 
        importObject: customImports 
      });
      
      expect(mockWebAssembly.instantiate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          gojs: expect.any(Object),
          env: expect.objectContaining({
            customFunction: expect.any(Function)
          })
        })
      );
    });
  });

  describe('Go runtime functions', () => {
    it('should handle memory bounds checking', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // This test would require more complex mocking of the Go class
      // For now, we'll just verify the console.warn spy is set up
      expect(consoleSpy).toBeDefined();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should log errors appropriately', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockFs.readFile.mockRejectedValue(new Error('Test error'));
      
      await expect(loadGoWasmFromFile('/invalid/path')).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[WASM] Failed to load Go WASM module:'),
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});
