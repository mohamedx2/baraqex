// Re-export everything from frontend-hamroun
export * from 'frontend-hamroun';

// Export type definitions (safe for all environments)
export type { ServerConfig, User, DbConfig, MiddlewareFunction } from './server/types.js';

// Export WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';
export type { GoWasmOptions, GoWasmInstance } from './server/types.js';

// Export template utilities (safe for browser)
export { generateDocument, generateErrorPage, generateLoadingPage } from './server/templates.js';

// Runtime environment detection
const isNode = typeof process !== 'undefined' && process.versions?.node;
const isBrowser = typeof window !== 'undefined';

// Export stubs for server functionality to prevent import errors in browser
export let BaraqexServer: any = null;
export let createServer: any = null;
export let createDevServer: any = null;
export let createProductionServer: any = null;
export let renderComponent: any = null;
export let Database: any = null;
export let AuthService: any = null;
export let ApiRouter: any = null;
export let requestLogger: any = null;
export let errorHandler: any = null;
export let notFoundHandler: any = null;
export let rateLimit: any = null;
export let initNodeWasm: any = null;
export let loadGoWasmFromFile: any = null;
export let safeJsonParse: any = (json: string, fallback: any) => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
export let generateToken: any = (length: number = 32) => {
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
export let hashString: any = null;
export let getPagination: any = null;
export let sendSuccess: any = null;
export let sendError: any = null;
export let validateFields: any = null;
export let validateFileUpload: any = null;
export let getEnvironmentInfo: any = null;
export let isDirectoryEmpty: any = null;
export let ensureDirectory: any = null;
export let writeJsonFile: any = null;
export let readJsonFile: any = null;
export let baraqexRenderToString: any = null;

// Conditional server module loading
if (isNode && !isBrowser) {
  // Only attempt to load server modules in Node.js environment
  Promise.resolve().then(async () => {
    try {
      // Check if server dependencies are available before importing
      try {
        await import('express');
      } catch {
        console.warn('Express not available - server functionality disabled');
        return;
      }

      const serverModule = await import('./server/index.js');
      
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
      const utilsModule = await import('./server/utils.js');
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
      
      // Assign server-renderer
      const rendererModule = await import('./server-renderer.js');
      baraqexRenderToString = rendererModule.renderToString;
      
    } catch (error: any) {
      console.warn('Server modules not available:', error.message);
    }
  });
}

// Simple renderToString function for SSR compatibility (always available)


console.log('Baraqex - powered by Frontend Hamroun Framework with additional utilities');

