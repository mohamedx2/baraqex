import express, { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AuthService } from './auth.js';

interface RouteHandler {
  (req: Request, res: Response, next?: NextFunction): void | Promise<void>;
}

interface RouteModule {
  get?: RouteHandler;
  post?: RouteHandler;
  put?: RouteHandler;
  delete?: RouteHandler;
  patch?: RouteHandler;
  options?: RouteHandler;
  middleware?: ((req: Request, res: Response, next: NextFunction) => void)[];
  // Add index signature to allow string indexing
  [key: string]: RouteHandler | ((req: Request, res: Response, next: NextFunction) => void)[] | undefined;
}

export class ApiRouter {
  public router: Router;
  private apiDir: string;
  private auth: AuthService | null;

  constructor(apiDir: string, auth: AuthService | null = null) {
    this.router = express.Router();
    this.apiDir = path.resolve(process.cwd(), apiDir);
    this.auth = auth;
    
    this.setupRoutes();
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
      // Dynamic import the route file
      const routeModule = await import(filePath);
      
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
          const routerMethod = this.router[method as keyof Router] as any;
          routerMethod(
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
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        await handler(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  }
}
