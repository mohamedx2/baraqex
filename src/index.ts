// Re-export everything from frontend-hamroun
export * from 'frontend-hamroun';

// Export type definitions (safe for all environments)
export type { ServerConfig, User, DbConfig, MiddlewareFunction } from './server/types.js';

// Export WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';
export type { GoWasmOptions, GoWasmInstance } from './server/types.js';

// Runtime environment detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';

// Declare all server functionality variables
let BaraqexServer: any = null;
let createServer: any = null;
let createDevServer: any = null;
let createProductionServer: any = null;
let renderComponent: any = null;
let Database: any = null;
let AuthService: any = null;
let ApiRouter: any = null;
let requestLogger: any = null;
let errorHandler: any = null;
let notFoundHandler: any = null;
let rateLimit: any = null;
let initNodeWasm: any = null;
let loadGoWasmFromFile: any = null;
let hashString: any = null;
let getPagination: any = null;
let sendSuccess: any = null;
let sendError: any = null;
let validateFields: any = null;
let validateFileUpload: any = null;
let getEnvironmentInfo: any = null;
let isDirectoryEmpty: any = null;
let ensureDirectory: any = null;
let writeJsonFile: any = null;
let readJsonFile: any = null;
let baraqexRenderToString: any = null;

// Browser-safe utilities with fallbacks
let safeJsonParse = (json: string, fallback: any) => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};

let generateToken = (length: number = 32) => {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Browser-safe template utilities
let generateDocument = (content: string, options: any = {}) => 
  `<!DOCTYPE html><html><head><title>${options.title || 'App'}</title></head><body>${content}</body></html>`;

let generateErrorPage = (code: number, message: string) => 
  `<div>Error ${code}: ${message}</div>`;

let generateLoadingPage = (message: string = 'Loading...') => 
  `<div>${message}</div>`;

// Browser-safe renderToString function
let renderToString = (component: any): string => {
  try {
    if (typeof component === 'function') {
      const result = component();
      return typeof result === 'string' ? result : String(result || '');
    }
    return String(component || '');
  } catch (error) {
    return '<div>Error rendering component</div>';
  }
};

// Initialize server modules in Node.js environment
if (isNode && !isBrowser) {
  // Use dynamic import with IIFE to handle async initialization
  (async () => {
    try {
      // Check if Express is available before importing server modules
      try {
        await import('express');
        
        // Import server modules
        const [serverModule, utilsModule, templatesModule, rendererModule] = await Promise.all([
          import('./server/index.js'),
          import('./server/utils.js'),
          import('./server/templates.js'),
          import('./server-renderer.js')
        ]);
        
        // Assign server functionality
        BaraqexServer = serverModule.Server;
        createServer = serverModule.createServer;
        createDevServer = serverModule.createDevServer;
        createProductionServer = serverModule.createProductionServer;
        renderComponent = serverModule.renderComponent;
        Database = serverModule.Database;
        AuthService = serverModule.AuthService;
        ApiRouter = serverModule.ApiRouter;
        requestLogger = serverModule.requestLogger;
        errorHandler = serverModule.errorHandler;
        notFoundHandler = serverModule.notFoundHandler;
        rateLimit = serverModule.rateLimit;
        initNodeWasm = serverModule.initNodeWasm;
        loadGoWasmFromFile = serverModule.loadGoWasmFromFile;
        
        // Assign server utilities
        safeJsonParse = utilsModule.safeJsonParse;
        generateToken = utilsModule.generateToken;
        hashString = utilsModule.hashString;
        getPagination = utilsModule.getPagination;
        sendSuccess = utilsModule.sendSuccess;
        sendError = utilsModule.sendError;
        validateFields = utilsModule.validateFields;
        validateFileUpload = utilsModule.validateFileUpload;
        getEnvironmentInfo = utilsModule.getEnvironmentInfo;
        isDirectoryEmpty = utilsModule.isDirectoryEmpty;
        ensureDirectory = utilsModule.ensureDirectory;
        writeJsonFile = utilsModule.writeJsonFile;
        readJsonFile = utilsModule.readJsonFile;
        
        // Assign template utilities
        generateDocument = templatesModule.generateDocument;
        generateErrorPage = templatesModule.generateErrorPage;
        generateLoadingPage = templatesModule.generateLoadingPage;
        
        // Assign server-renderer
        baraqexRenderToString = rendererModule.renderToString;
        
      } catch (expressError) {
        console.warn('Express not available - server functionality disabled');
        // Set error functions
        createServer = () => {
          throw new Error('Server functionality not available. Make sure you have Express installed: npm install express @types/express');
        };
        createDevServer = () => {
          throw new Error('Server functionality not available. Make sure you have Express installed: npm install express @types/express');
        };
        createProductionServer = () => {
          throw new Error('Server functionality not available. Make sure you have Express installed: npm install express @types/express');
        };
      }
    } catch (error: any) {
      console.warn('Server modules not available:', error.message);
    }
  })();
}

// Export all the variables
export {
  BaraqexServer,
  createServer,
  createDevServer,
  createProductionServer,
  renderComponent,
  Database,
  AuthService,
  ApiRouter,
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimit,
  initNodeWasm,
  loadGoWasmFromFile,
  safeJsonParse,
  generateToken,
  hashString,
  getPagination,
  sendSuccess,
  sendError,
  validateFields,
  validateFileUpload,
  getEnvironmentInfo,
  isDirectoryEmpty,
  ensureDirectory,
  writeJsonFile,
  readJsonFile,
  generateDocument,
  generateErrorPage,
  generateLoadingPage,
  baraqexRenderToString,
  renderToString
};

console.log('Baraqex - powered by Frontend Hamroun Framework with additional utilities');

