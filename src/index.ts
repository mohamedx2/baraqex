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

// Import template utilities with conditional loading
let templateGenerateDocument: any = null;
let templateGenerateErrorPage: any = null;
let templateGenerateLoadingPage: any = null;

// Server functionality variables (will be assigned if available)
let BaraqexServerClass: any = null;
let createServerFn: any = null;
let createDevServerFn: any = null;
let createProductionServerFn: any = null;
let renderComponentFn: any = null;
let DatabaseClass: any = null;
let AuthServiceClass: any = null;
let ApiRouterClass: any = null;
let requestLoggerFn: any = null;
let errorHandlerFn: any = null;
let notFoundHandlerFn: any = null;
let rateLimitFn: any = null;
let initNodeWasmFn: any = null;
let loadGoWasmFromFileFn: any = null;
let safeJsonParseFn: any = (json: string, fallback: any) => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
};
let generateTokenFn: any = (length: number = 32) => {
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
let hashStringFn: any = null;
let getPaginationFn: any = null;
let sendSuccessFn: any = null;
let sendErrorFn: any = null;
let validateFieldsFn: any = null;
let validateFileUploadFn: any = null;
let getEnvironmentInfoFn: any = null;
let isDirectoryEmptyFn: any = null;
let ensureDirectoryFn: any = null;
let writeJsonFileFn: any = null;
let readJsonFileFn: any = null;
let baraqexRenderToStringFn: any = null;

// Conditional server module loading
if (isNode && !isBrowser) {
  // Only attempt to load server modules in Node.js environment
  Promise.resolve().then(async () => {
    try {
      // Load template utilities first
      const templatesModule = await import('./server/templates.js');
      templateGenerateDocument = templatesModule.generateDocument;
      templateGenerateErrorPage = templatesModule.generateErrorPage;
      templateGenerateLoadingPage = templatesModule.generateLoadingPage;

      // Check if server dependencies are available before importing
      try {
        await import('express');
      } catch {
        console.warn('Express not available - server functionality disabled');
        return;
      }

      const serverModule = await import('./server/index.js');
      
      // Assign server functionality
      BaraqexServerClass = serverModule.Server;
      createServerFn = serverModule.createServer;
      createDevServerFn = serverModule.createDevServer;
      createProductionServerFn = serverModule.createProductionServer;
      renderComponentFn = serverModule.renderComponent;
      DatabaseClass = serverModule.Database;
      AuthServiceClass = serverModule.AuthService;
      ApiRouterClass = serverModule.ApiRouter;
      requestLoggerFn = serverModule.requestLogger;
      errorHandlerFn = serverModule.errorHandler;
      notFoundHandlerFn = serverModule.notFoundHandler;
      rateLimitFn = serverModule.rateLimit;
      initNodeWasmFn = serverModule.initNodeWasm;
      loadGoWasmFromFileFn = serverModule.loadGoWasmFromFile;
      
      // Assign server utilities
      const utilsModule = await import('./server/utils.js');
      safeJsonParseFn = utilsModule.safeJsonParse;
      generateTokenFn = utilsModule.generateToken;
      hashStringFn = utilsModule.hashString;
      getPaginationFn = utilsModule.getPagination;
      sendSuccessFn = utilsModule.sendSuccess;
      sendErrorFn = utilsModule.sendError;
      validateFieldsFn = utilsModule.validateFields;
      validateFileUploadFn = utilsModule.validateFileUpload;
      getEnvironmentInfoFn = utilsModule.getEnvironmentInfo;
      isDirectoryEmptyFn = utilsModule.isDirectoryEmpty;
      ensureDirectoryFn = utilsModule.ensureDirectory;
      writeJsonFileFn = utilsModule.writeJsonFile;
      readJsonFileFn = utilsModule.readJsonFile;
      
      // Assign server-renderer
      const rendererModule = await import('./server-renderer.js');
      baraqexRenderToStringFn = rendererModule.renderToString;
      
    } catch (error: any) {
      console.warn('Server modules not available:', error.message);
    }
  });
} else {
  // Browser environment - load templates with safe fallbacks
  templateGenerateDocument = (content: string, options: any = {}) => 
    `<!DOCTYPE html><html><head><title>${options.title || 'App'}</title></head><body>${content}</body></html>`;
  templateGenerateErrorPage = (code: number, message: string) => 
    `<div>Error ${code}: ${message}</div>`;
  templateGenerateLoadingPage = (message: string = 'Loading...') => 
    `<div>${message}</div>`;
}

// Simple renderToString function for SSR compatibility (always available)
let renderToStringFallback = (component: any): string => {
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

// Export server functionality with safe getters
export const BaraqexServer = BaraqexServerClass;
export const createServer = createServerFn;
export const createDevServer = createDevServerFn;
export const createProductionServer = createProductionServerFn;
export const renderComponent = renderComponentFn;
export const Database = DatabaseClass;
export const AuthService = AuthServiceClass;
export const ApiRouter = ApiRouterClass;
export const requestLogger = requestLoggerFn;
export const errorHandler = errorHandlerFn;
export const notFoundHandler = notFoundHandlerFn;
export const rateLimit = rateLimitFn;
export const initNodeWasm = initNodeWasmFn;
export const loadGoWasmFromFile = loadGoWasmFromFileFn;
export const safeJsonParse = safeJsonParseFn;
export const generateToken = generateTokenFn;
export const hashString = hashStringFn;
export const getPagination = getPaginationFn;
export const sendSuccess = sendSuccessFn;
export const sendError = sendErrorFn;
export const validateFields = validateFieldsFn;
export const validateFileUpload = validateFileUploadFn;
export const getEnvironmentInfo = getEnvironmentInfoFn;
export const isDirectoryEmpty = isDirectoryEmptyFn;
export const ensureDirectory = ensureDirectoryFn;
export const writeJsonFile = writeJsonFileFn;
export const readJsonFile = readJsonFileFn;
export const baraqexRenderToString = baraqexRenderToStringFn;

// Export template utilities with safe getters
export const generateDocument = () => templateGenerateDocument || templateGenerateDocument;
export const generateErrorPage = () => templateGenerateErrorPage || templateGenerateErrorPage;
export const generateLoadingPage = () => templateGenerateLoadingPage || templateGenerateLoadingPage;

// Export template utilities with alternative names
export const generateDocumentTemplate = () => templateGenerateDocument || templateGenerateDocument;
export const generateErrorPageTemplate = () => templateGenerateErrorPage || templateGenerateErrorPage;
export const generateLoadingPageTemplate = () => templateGenerateLoadingPage || templateGenerateLoadingPage;

// Export the fallback renderToString
export const renderToString = renderToStringFallback;

console.log('Baraqex - powered by Frontend Hamroun Framework with additional utilities');

