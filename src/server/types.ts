// Type definitions without actual implementation
// These can be safely imported in any environment

export interface ServerConfig {
  port?: number;
  apiDir?: string;
  pagesDir?: string;
  staticDir?: string;
  enableCors?: boolean;
  corsOptions?: any;
  db?: {
    url: string;
    type: 'mongodb' | 'mysql' | 'postgres';
  };
  auth?: {
    secret: string;
    expiresIn?: string;
  };
}

export interface Server {
  start(): Promise<void>;
  stop(): Promise<void>;
  getExpressApp(): any;
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
