import path from 'path';
import fs from 'fs';
import { AuthService } from './auth.js';
import { pathToFileURL } from 'url';

interface RouteHandler {
  (req: any, res: any, next?: any): void | Promise<void>;
}

interface RouteModule {
  get?: RouteHandler;
  post?: RouteHandler;
  put?: RouteHandler;
  delete?: RouteHandler;
  patch?: RouteHandler;
  options?: RouteHandler;
  middleware?: ((req: any, res: any, next: any) => void)[];
  // Add index signature to allow string indexing
  [key: string]: RouteHandler | ((req: any, res: any, next: any) => void)[] | undefined;
}

export class ApiRouter {
  public router: any = null;
  private apiDir: string;
  private auth: AuthService | null;
  private initialized: boolean = false;

  constructor(apiDir: string, auth: AuthService | null = null) {
    this.apiDir = path.resolve(process.cwd(), apiDir);
    this.auth = auth;
    // Don't call async method in constructor
  }

  async initialize(): Promise<void> {
    if (this.initialized && this.router) return;
    
    try {
      const express = await import('express');
      this.router = express.default.Router();
      this.setupRoutes();
      this.initialized = true;
      console.log('✅ API Router initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to initialize API Router:', error);
      if (error.code === 'MODULE_NOT_FOUND') {
        throw new Error('Express not installed. Run: npm install express @types/express');
      }
      throw error;
    }
  }

  isInitialized(): boolean {
    return this.initialized && this.router !== null;
  }

  private setupRoutes() {
    if (!fs.existsSync(this.apiDir)) {
      console.log(`API directory not found: ${this.apiDir}`);
      return;
    }

    this.scanDirectory(this.apiDir, '');
  }

  private scanDirectory(dirPath: string, routePrefix: string) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        this.scanDirectory(fullPath, `${routePrefix}/${entry.name}`);
      } else if (this.isRouteFile(entry.name)) {
        // Process route file
        const routePath = this.getRoutePath(entry.name, routePrefix);
        this.registerRoute(fullPath, routePath);
      }
    }
  }

  private isRouteFile(filename: string): boolean {
    return filename.endsWith('.js') || 
           filename.endsWith('.ts') || 
           filename.endsWith('.mjs');
  }

  private getRoutePath(filename: string, routePrefix: string): string {
    // Remove extension and handle special names
    const baseName = path.basename(filename, path.extname(filename));
    
    if (baseName === 'index') {
      return routePrefix || '/';
    }
    
    // Handle dynamic routes [param]
    const paramMatch = baseName.match(/^\[(.+)\]$/);
    if (paramMatch) {
      return `${routePrefix}/:${paramMatch[1]}`;
    }
    
    return `${routePrefix}/${baseName}`;
  }

  private async registerRoute(filePath: string, routePath: string) {
    try {
      // Ensure we have an absolute path and normalize it for Windows
      const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);
      
      // Convert to proper file:// URL - this fixes the Windows ESM issue
      const fileUrl = pathToFileURL(absolutePath).href;
      
      // Add cache busting parameter to force reload
      const urlWithTimestamp = `${fileUrl}?t=${Date.now()}`;
      
      // Dynamic import the route file
      const routeModule = await import(urlWithTimestamp);
      
      if (!this.isValidRouteModule(routeModule)) {
        console.warn(`Invalid route module: ${filePath}`);
        return;
      }
      
      console.log(`Registering API route: ${routePath}`);
      
      // Register middleware if any
      const middleware = routeModule.middleware || [];
      
      // Register HTTP methods
      for (const method of ['get', 'post', 'put', 'delete', 'patch', 'options']) {
        const handler = routeModule[method];
        if (typeof handler === 'function') {
          const routerMethod = this.router[method];
          routerMethod.call(
            this.router,
            routePath, 
            ...middleware,
            this.wrapHandler(handler)
          );
        }
      }
    } catch (error) {
      console.error(`Error registering route (${filePath}):`, error);
    }
  }

  private isValidRouteModule(module: any): module is RouteModule {
    if (!module) return false;
    
    // Check if at least one HTTP method handler is defined
    return ['get', 'post', 'put', 'delete', 'patch', 'options']
      .some(method => typeof module[method] === 'function');
  }

  private wrapHandler(handler: RouteHandler) {
    return async (req: any, res: any, next: any) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }
}
