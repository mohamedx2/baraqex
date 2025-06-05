import { Express } from 'express';

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

export interface Server {
  start(): Promise<void>;
  stop(): Promise<void>;
  getExpressApp(): Express;
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
