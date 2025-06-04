import express, { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import http from 'http';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import cors from 'cors';
import { SignOptions } from 'jsonwebtoken';
// Fix the import - use a simple renderToString function instead
import { Database } from './database.js';
import { AuthService } from './auth.js';
import { ApiRouter } from './api-router.js';
import { requestLogger, errorHandler, notFoundHandler, rateLimit } from './middleware.js';

// Import the utility functions
import * as utils from './utils.js';
import * as templates from './templates.js';
import { initNodeWasm, loadGoWasmFromFile, callWasmFunction, isWasmReady, getWasmFunctions } from './wasm.js';

// Simple renderToString function for server-side rendering
function renderToString(content: any): Promise<string> {
  if (typeof content === 'string') {
    return Promise.resolve(content);
  }
  if (typeof content === 'function') {
    return Promise.resolve(content());
  }
  return Promise.resolve(String(content));
}

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
      this.auth = new AuthService({
        secret: this.config.auth.secret,
        expiresIn: this.config.auth.expiresIn
      });
      this.app.use(this.auth.initialize());
    }
    
    // Static files - setup before other routes
    const staticPath = path.resolve(process.cwd(), this.config.staticDir!);
    if (fs.existsSync(staticPath)) {
      this.app.use(express.static(staticPath));
    }
    
    // Setup API routes
    this.setupApiRoutes();
    
    // Setup page routes (for SSR)
    this.setupPageRoutes();
    
    // Add error handlers at the end
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
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
    const pagesPath = path.resolve(process.cwd(), this.config.pagesDir!);
    if (!fs.existsSync(pagesPath)) {
      return;
    }

    // Setup catch-all route for SSR - but only if pages directory exists
    this.app.get('*', async (req, res) => {
      try {
        const { html, statusCode } = await this.renderPage(req.path);
        res.status(statusCode || 200).send(html);
      } catch (error) {
        console.error('Error rendering page:', error);
        const errorHtml = templates.generateErrorPage(500, 'Server Error');
        res.status(500).send(errorHtml);
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
      
      // Try to find a matching page file - prioritize .js files over .jsx for ESM compatibility
      let pagePath = '';
      const possiblePaths = [
        path.join(pagesDir, `${normalizedPath}.js`),
        path.join(pagesDir, `${normalizedPath}.mjs`),
        path.join(pagesDir, `${normalizedPath}.ts`),
        path.join(pagesDir, `${normalizedPath}/index.js`),
        path.join(pagesDir, `${normalizedPath}/index.mjs`),
        path.join(pagesDir, `${normalizedPath}/index.ts`),
        // JSX files as fallback (will need special handling)
        path.join(pagesDir, `${normalizedPath}.jsx`),
        path.join(pagesDir, `${normalizedPath}.tsx`),
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
      
      // Check if it's a JSX/TSX file and handle accordingly
      if (pagePath.endsWith('.jsx') || pagePath.endsWith('.tsx')) {
        return { 
          html: templates.generateErrorPage(500, 'JSX/TSX files are not supported in server-side rendering. Please use .js or .ts files instead.'), 
          statusCode: 500 
        };
      }
      
      // Import and render the page component
      try {
        // Convert to proper file:// URL for all platforms
        const absolutePath = path.resolve(pagePath);
        const fileUrl = pathToFileURL(absolutePath).href;
        
        // Add timestamp to force reload and avoid caching issues
        const urlWithTimestamp = `${fileUrl}?t=${Date.now()}`;
        
        const pageModule = await import(urlWithTimestamp);
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
        
        // Check if the returned HTML is already a complete document
        if (html.trim().startsWith('<!DOCTYPE html>') || html.trim().startsWith('<html')) {
          // Return the complete HTML document as-is
          return { html, statusCode: 200 };
        }
        
        // Generate the full HTML document only if it's not complete
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
          styles: ['/fullstack-styles.css'],
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
      const clientJsPath = path.join(staticDir, 'client.js');
      if (!fs.existsSync(clientJsPath)) {
        const clientJsContent = `
// Simple client-side script for Baraqex (no ES6 imports)
console.log('🚀 Baraqex client-side script loaded');

// Add interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Client-side hydration starting...');
  
  // Add smooth scrolling to anchor links
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Add form enhancements
  const forms = document.querySelectorAll('form');
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        // Add loading state
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        
        // Reset button after a delay if form doesn't handle it
        setTimeout(function() {
          if (submitBtn.disabled) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }, 5000);
      }
    });
  });
  
  console.log('✅ Client-side hydration complete');
});

// Global error handler
window.addEventListener('error', function(e) {
  console.error('🚨 Client error:', e.error);
});

// Handle API requests with better error handling
window.apiRequest = async function(url, options) {
  options = options || {};
  
  try {
    const token = localStorage.getItem('token');
    const headers = Object.assign({
      'Content-Type': 'application/json'
    }, options.headers || {});
    
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }
    
    const response = await fetch(url, Object.assign({}, options, {
      headers: headers
    }));
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
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
    // Handle different component types
    let result: any;
    
    if (typeof Component === 'function') {
      // Call the component function with props
      result = Component(props);
    } else {
      result = Component;
    }
    
    // Create HTML string from component
    const html = await renderToString(result);
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
export { initNodeWasm, loadGoWasmFromFile, callWasmFunction, isWasmReady, getWasmFunctions } from './wasm.js';

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
  callWasmFunction,  // Add this missing export
  isWasmReady,
  getWasmFunctions,
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

