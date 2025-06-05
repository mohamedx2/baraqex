// Type definitions without actual implementation
// These can be safely imported in any environment

export interface ServerConfig {
  port?: number;
  apiDir?: string;
  pagesDir?: string;
  staticDir?: string;
  enableCors?: boolean;
  corsOptions?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
  db?: {
    url: string;
    type: 'mongodb' | 'mysql' | 'postgres';
  };
  auth?: {
    secret: string;
    expiresIn?: string | number;
  };
}

// Server interface - only define types, no implementation
export interface Server {
  start(): Promise<void>;
  stop(): Promise<void>;
  getExpressApp(): any; // Use 'any' to avoid Express import
  getDatabase(): any;
  getAuth(): any;
}

export interface User {
  id: string | number;
  username: string;
  password?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

export interface DbConfig {
  url: string;
  type: 'mongodb' | 'mysql' | 'postgres';
}

export interface MiddlewareFunction {
  (req: any, res: any, next: any): void | Promise<void>;
}

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

export interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

export interface GoWasmInstance {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  exports: WebAssembly.Exports;
  functions: Record<string, Function>;
}

export interface GoWasmOptions {
  debug?: boolean;
  goWasmPath?: string;
  importObject?: Record<string, any>;
  onLoad?: (instance: GoWasmInstance) => void;
}

// Runtime environment detection
export const isBrowser = typeof window !== 'undefined';
export const isNode = typeof process !== 'undefined' && process.versions?.node;

// Conditional exports based on environment
export const createConditionalExport = <T>(
  browserImpl: () => T,
  nodeImpl: () => T,
  fallback?: T
): T => {
  try {
    if (isBrowser) {
      return browserImpl();
    } else if (isNode) {
      return nodeImpl();
    }
    return fallback || ({} as T);
  } catch (error) {
    console.warn('Error in conditional export:', error);
    return fallback || ({} as T);
  }
};
