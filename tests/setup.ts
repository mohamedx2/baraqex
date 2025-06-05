// Global test setup
import { afterAll, beforeEach, jest } from '@jest/globals';

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeEach(() => {
  // Reset console mocks before each test
  jest.clearAllMocks();
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
});

// Mock WebAssembly if not available in test environment
if (typeof global.WebAssembly === 'undefined') {
  const mockModule = {} as WebAssembly.Module;
  
  global.WebAssembly = {
    compile: (jest.fn() as any).mockResolvedValue(mockModule),
    instantiate: (jest.fn() as any).mockResolvedValue({ 
      instance: { exports: {} }, 
      module: {} 
    }),
    compileStreaming: (jest.fn() as any).mockResolvedValue(mockModule),
    instantiateStreaming: (jest.fn() as any).mockResolvedValue({ 
      instance: { exports: {} }, 
      module: {} 
    }),
    Instance: jest.fn() as any,
    Module: jest.fn() as any,
    Memory: jest.fn() as any,
    Table: jest.fn() as any,
    Global: jest.fn() as any,
    validate: jest.fn().mockReturnValue(true) as any,
    CompileError: Error as any,
    LinkError: Error as any,
    RuntimeError: Error as any
  };
}

// Mock TextEncoder/TextDecoder if not available
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class {
    encode(input: string) {
      return new Uint8Array(Buffer.from(input, 'utf8'));
    }
  } as any;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = class {
    decode(input: Uint8Array) {
      return Buffer.from(input).toString('utf8');
    }
  } as any;
}

// Set up global test timeout
jest.setTimeout(10000);
