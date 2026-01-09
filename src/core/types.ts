/**
 * Core type definitions for the framework
 */

export type { Context } from './context.js';

export interface VNode {
  type: string | Function;
  props: Record<string, any>;
  key?: string | number;
}

export type Component<P = any> = (props: P) => VNode | null;

export type FC<P = {}> = Component<P>;

export interface RefObject<T> {
  current: T;
}

export type SetStateAction<S> = S | ((prevState: S) => S);
export type Dispatch<A> = (value: A) => void;

// Global JSX namespace
// Props types
export type Props = Record<string, any>;
export type PropsWithChildren<P = {}> = P & { children?: any };

// Global JSX namespace
declare global {
  namespace JSX {
    interface Element {
      type: string | Function;
      props: Record<string, any>;
      key?: string | number;
    }
    type IntrinsicElements = Record<string, any>;
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
  }
}

// Server types
export interface ServerConfig {
  port?: number;
  apiDir?: string;
  pagesDir?: string;
  staticDir?: string;
  enableCors?: boolean;
  corsOptions?: any;
  db?: DbConfig;
  auth?: AuthConfig;
}

export interface DbConfig {
  url: string;
  type: 'mongodb' | 'mysql' | 'postgres';
}

export interface AuthConfig {
  secret: string;
  expiresIn?: string;
}

export interface User {
  id: string | number;
  username: string;
  password?: string;
  email?: string;
  roles?: string[];
  [key: string]: any;
}

export interface MiddlewareFunction {
  (req: any, res: any, next: any): void | Promise<void>;
}
