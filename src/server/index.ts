import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import { SignOptions } from 'jsonwebtoken';
import { renderToString } from 'frontend-hamroun';
import { Database } from './database.js';
import { AuthService } from './auth.js';
import { ApiRouter } from './api-router.js';
import { requestLogger, errorHandler, notFoundHandler, rateLimit } from './middleware.js';

// Import the utility functions
import * as utils from './utils.js';
import * as templates from './templates.js';
import { initNodeWasm, loadGoWasmFromFile } from './wasm.js';

// Helper function to get the component name from the file path
function getComponentName(filePath: string, pagesDir: string): string {
  try {
    // Get relative path from pages directory
    const relativePath = path.relative(pagesDir, filePath);
    // Remove extension
    const withoutExt = relativePath.replace(/\.[^/.]+$/, '');
    // Replace index with empty for clean paths
    const cleanPath = withoutExt.replace(/\/index$/, '');
    // Convert to module path format
    return `/pages/${cleanPath}`;
  } catch (e) {
    return '';
  }
}

export interface ServerConfig {
  port?: number;
  apiDir?: string;
  pagesDir?: string;
  staticDir?: string;
  enableCors?: boolean;
  corsOptions?: cors.CorsOptions;
  db?: {
    url: string;
    type: 'mongodb' | 'mysql' | 'postgres';
  };
  auth?: {
    secret: string;
    expiresIn?: SignOptions['expiresIn'];
  };
}

export class Server {
  private app: Express;
  private server: http.Server | null = null;
  private config: ServerConfig;
  private db: Database | null = null;
  private auth: AuthService | null = null;

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: 3000,
      apiDir: './api',
      pagesDir: './pages',
      staticDir: './public',
      enableCors: true,
      ...config
    };

    this.app = express();
    
    // Basic middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS setup
    if (this.config.enableCors) {
      this.app.use(cors(this.config.corsOptions));
    }
    
    // Setup database if configured
    if (this.config.db) {
      this.db = new Database(this.config.db);
    }
    
    // Setup auth if configured
    if (this.config.auth) {
      // Fix by explicitly typing the auth configuration
      this.auth = new AuthService({
        secret: this.config.auth.secret,
        expiresIn: this.config.auth.expiresIn
      });
      // Expose auth middleware
      this.app.use(this.auth.initialize());
    }
    
    // Static files
    if (fs.existsSync(path.resolve(process.cwd(), this.config.staticDir!))) {
      this.app.use(express.static(path.resolve(process.cwd(), this.config.staticDir!)));
    }
    
    // Setup API routes
    this.setupApiRoutes();
    
    // Setup page routes (for SSR)
    this.setupPageRoutes();
  }

  private setupApiRoutes() {
    const apiRouter = new ApiRouter(this.config.apiDir!, this.auth);
    this.app.use('/api', requestLogger, apiRouter.router);
    
    // Add API documentation route
    this.app.get('/api-docs', (req, res) => {
      const apiDocs = this.generateApiDocs();
      res.json(apiDocs);
    });
  }

  private generateApiDocs() {
    // Generate documentation based on API routes
    const apiDir = path.resolve(process.cwd(), this.config.apiDir!);
    const docs = { endpoints: [] as any[] };
    
    if (fs.existsSync(apiDir)) {
      this.scanApiDirectory(apiDir, '', docs.endpoints);
    }
    
    return docs;
  }
  
  private scanApiDirectory(dirPath: string, routePrefix: string, endpoints: any[]) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        this.scanApiDirectory(fullPath, `${routePrefix}/${entry.name}`, endpoints);
      } else if (entry.name.endsWith('.js') || entry.name.endsWith('.ts')) {
        const routePath = this.getRoutePath(entry.name, routePrefix);
        endpoints.push({
          path: routePath,
          file: path.relative(process.cwd(), fullPath),
          methods: this.detectApiMethods(fullPath)
        });
      }
    }
  }
  
  private getRoutePath(filename: string, routePrefix: string): string {
    const baseName = path.basename(filename, path.extname(filename));
    
    if (baseName === 'index') {
      return routePrefix || '/';
    }
    
    const paramMatch = baseName.match(/^\[(.+)\]$/);
    if (paramMatch) {
      return `${routePrefix}/:${paramMatch[1]}`;
    }
    
    return `${routePrefix}/${baseName}`;
  }
  
  private detectApiMethods(filePath: string): string[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const methods = ['get', 'post', 'put', 'delete', 'patch', 'options'];
      return methods.filter(method => 
        new RegExp(`export (async )?function ${method}\\s*\\(`).test(content) ||
        new RegExp(`export const ${method}\\s*=`).test(content)
      );
    } catch (error) {
      return [];
    }
  }

  private setupPageRoutes() {
    if (!fs.existsSync(path.resolve(process.cwd(), this.config.pagesDir!))) {
      return;
    }

    // Setup catch-all route for SSR
    this.app.get('*', async (req, res) => {
      try {
        // Implement page routing logic
        const { html, statusCode } = await this.renderPage(req.path);
        res.status(statusCode || 200).send(html);
      } catch (error) {
        console.error('Error rendering page:', error);
        res.status(500).send('Server Error');
      }
    });
  }

  private async renderPage(routePath: string): Promise<{ html: string, statusCode?: number }> {
    try {
      // Try to find the page component
      const pagesDir = this.config.pagesDir ? path.resolve(process.cwd(), this.config.pagesDir) : '';
      if (!pagesDir || !fs.existsSync(pagesDir)) {
        return { 
          html: templates.generateErrorPage(404, 'Pages directory not found'), 
          statusCode: 404 
        };
      }
      
      // Normalize the path
      let normalizedPath = routePath;
      if (!normalizedPath.startsWith('/')) {
        normalizedPath = '/' + normalizedPath;
      }
      
      // Default to index for the root
      if (normalizedPath === '/') {
        normalizedPath = '/index';
      }
      
      // Try to find a matching page file
      let pagePath = '';
      const possiblePaths = [
        path.join(pagesDir, `${normalizedPath}.js`),
        path.join(pagesDir, `${normalizedPath}.ts`),
        path.join(pagesDir, `${normalizedPath}.jsx`),
        path.join(pagesDir, `${normalizedPath}.tsx`),
        path.join(pagesDir, `${normalizedPath}/index.js`),
        path.join(pagesDir, `${normalizedPath}/index.ts`),
        path.join(pagesDir, `${normalizedPath}/index.jsx`),
        path.join(pagesDir, `${normalizedPath}/index.tsx`)
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
          pagePath = p;
          break;
        }
      }
      
      // Handle 404 if page not found
      if (!pagePath) {
        return { 
          html: templates.generateErrorPage(404, `Page not found: ${normalizedPath}`), 
          statusCode: 404 
        };
      }
      
      // Import and render the page component
      try {
        const pageModule = await import(pagePath);
        if (!pageModule || !pageModule.default) {
          throw new Error(`No default export found in ${pagePath}`);
        }
        
        const PageComponent = pageModule.default;
        const initialProps = {
          // Provide any initial props here
          path: normalizedPath,
          query: {}, // Could be parsed from URL
          api: { serverTime: new Date().toISOString() }
        };
        
        // Render the component to HTML
        const { html, success, error } = await renderComponent(PageComponent, initialProps);
        
        if (!success) {
          return { 
            html: templates.generateErrorPage(500, 'Failed to render page', error instanceof Error ? error : new Error('Unknown error')), 
            statusCode: 500 
          };
        }
        
        // Generate the full HTML document
        let pageTitle = 'My App';
        try {
          // Try to extract title from component if it has a getTitle method
          if (typeof PageComponent.getTitle === 'function') {
            pageTitle = PageComponent.getTitle(initialProps);
          } else if (PageComponent.title) {
            pageTitle = PageComponent.title;
          }
        } catch (e) {
          // Ignore title errors
        }
        
        // Parse the component name for hydration
        const componentName = getComponentName(pagePath, pagesDir);
        
        // Generate full HTML document with our template
        const fullHtml = templates.generateDocument(html, {
          title: pageTitle,
          // Get description from component if available
          description: typeof PageComponent.getDescription === 'function' 
            ? PageComponent.getDescription(initialProps) 
            : (PageComponent.description || ''),
          // Add scripts for client-side hydration
          scripts: ['/client.js'],
          // Add any custom meta tags
          meta: typeof PageComponent.getMeta === 'function'
            ? PageComponent.getMeta(initialProps)
            : {},
          // Add custom styles
          styles: ['/styles.css'],
          // Add initial data for client-side hydration
          initialData: initialProps,
          // Add component information for hydration
          componentName: componentName
        });
        
        return { html: fullHtml, statusCode: 200 };
        
      } catch (error) {
        console.error('Error rendering page:', error);
        return { 
          html: templates.generateErrorPage(500, 'Error rendering page', error instanceof Error ? error : new Error('Unknown error')), 
          statusCode: 500 
        };
      }
    } catch (error) {
      console.error('Error finding page:', error);
      return { 
        html: templates.generateErrorPage(500, 'Server error', error instanceof Error ? error : new Error('Unknown error')), 
        statusCode: 500 
      };
    }
  }

  public getExpressApp(): Express {
    return this.app;
  }

  public getDatabase(): Database | null {
    return this.db;
  }

  public getAuth(): AuthService | null {
    return this.auth;
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.config.port, () => {
        console.log(`Server running at http://localhost:${this.config.port}`);
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        return resolve();
      }
      
      this.server.close((err) => {
        if (err) return reject(err);
        this.server = null;
        resolve();
      });
    });
  }

  public restart(): Promise<void> {
    return this.stop().then(() => this.start());
  }
  
  public enableSSR(options: { hydratable?: boolean } = {}): void {
    if (!fs.existsSync(path.resolve(process.cwd(), this.config.pagesDir!))) {
      fs.mkdirSync(path.resolve(process.cwd(), this.config.pagesDir!), { recursive: true });
    }
    
    // Set up client-side JS for hydration if needed
    if (options.hydratable) {
      const staticDir = path.resolve(process.cwd(), this.config.staticDir!);
      if (!fs.existsSync(staticDir)) {
        fs.mkdirSync(staticDir, { recursive: true });
      }
      
      // Generate or copy client hydration script
      // This is a simplified example - would need more implementation
      const clientJsPath = path.join(staticDir, 'client.js');
      if (!fs.existsSync(clientJsPath)) {
        const clientJsContent = `
          // Auto-generated hydration script
          import { hydrate } from 'frontend-hamroun';
          
          // Find SSR content and hydrate it
          document.addEventListener('DOMContentLoaded', () => {
            const ssrRoots = document.querySelectorAll('[data-ssr-root]');
            ssrRoots.forEach(root => {
              const componentPath = root.getAttribute('data-component');
              if (componentPath) {
                import(componentPath).then(module => {
                  hydrate(module.default, root);
                });
              }
            });
          });
        `;
        fs.writeFileSync(clientJsPath, clientJsContent);
      }
    }
  }

  public registerPlugin(plugin: (server: Server) => void): void {
    plugin(this);
  }
  
  public addShutdownHandler(): void {
    // Handle graceful shutdown
    const gracefulShutdown = async () => {
      console.log('Received shutdown signal, closing server...');
      try {
        await this.stop();
        if (this.db) {
          await this.db.disconnect();
        }
        console.log('Server shut down gracefully');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    
    // Listen for termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }
}

// Add server utility functions

/**
 * Creates and configures a new server instance
 */
export function createServer(config: ServerConfig = {}): Server {
  return new Server(config);
}

/**
 * Creates a new server with sensible defaults for development
 */
export function createDevServer(options: {
  port?: number;
  enableCors?: boolean;
} = {}): Server {
  return new Server({
    port: options.port || 3000,
    enableCors: options.enableCors !== false,
    apiDir: './src/api',
    pagesDir: './src/pages',
    staticDir: './public'
  });
}

/**
 * Creates a production-ready server with optimized settings
 */
export function createProductionServer(config: ServerConfig): Server {
  const server = new Server({
    ...config,
    // Fix the PORT parsing
    port: config.port || (process.env.PORT ? parseInt(process.env.PORT) : 8080)
  });
  
  // Add shutdown handler for production environments
  server.addShutdownHandler();
  
  return server;
}

// Export additional utility functions
export function getRequestIp(req: Request): string {
  return req.ip || 
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || 
    req.socket.remoteAddress || 
    '';
}

export function parseCookies(req: Request): Record<string, string> {
  const cookies: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
    });
  }
  
  return cookies;
}

// Fix the renderComponent function
export const renderComponent = async (Component: any, props: any = {}) => {
  try {
    // Create HTML string from component
    const html = renderToString(Component(props));
    return {
      html,
      success: true
    };
  } catch (error) {
    console.error('Error rendering component:', error);
    return {
      html: `<div class="error">Error rendering component</div>`,
      success: false,
      error
    };
  }
};

// Export WASM utilities for server-side usage
export { initNodeWasm, loadGoWasmFromFile } from './wasm.js';

// Import and export server utilities
export * from './utils.js';
export * from './templates.js';

// Export the Database and AuthService classes
export { Database } from './database.js';
export { AuthService } from './auth.js';
export { ApiRouter } from './api-router.js';
export { 
  requestLogger, 
  errorHandler, 
  notFoundHandler, 
  rateLimit 
} from './middleware.js';

// Export renderToString for convenient SSR
export { renderToString };

// Ensure the default export includes all required functions
export default {
  Server,
  createServer,
  createDevServer,
  createProductionServer,
  rateLimit,
  requestLogger,
  errorHandler,
  notFoundHandler,
  loadGoWasmFromFile,
  // Template utilities
  templates,
  // Server utilities
  utils,
  // Additional exports
  renderComponent,
  renderToString,
  getRequestIp,
  parseCookies,
  Database,
  AuthService,
  ApiRouter
};

