// Re-export everything from frontend-hamroun
export * from 'frontend-hamroun';

// Also export as default for compatibility

// Export server functionality that actually exists and compiles
export { generateDocument, generateErrorPage, generateLoadingPage } from './server/templates.js';
export { 
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
  readJsonFile
} from './server/utils.js';

// Export types
export type { ServerConfig, User, DbConfig, MiddlewareFunction } from './server/types.js';

// Export server-renderer functions
export { renderToString as baraqexRenderToString } from './server-renderer.js';

// Export middleware functions
export { requestLogger, errorHandler, notFoundHandler, rateLimit } from './server/middleware.js';

// Export WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';
export type { GoWasmOptions, GoWasmInstance } from './wasm.js';
export { Server as BaraqexServer } from './server/index.js';

// Export server functionality
export {createDevServer,createServer,createProductionServer} from './server/index.js';

// Simple renderToString function for SSR compatibility
export function renderToString(content: any): Promise<string> {
  if (typeof content === 'string') {
    return Promise.resolve(content);
  }
  if (typeof content === 'function') {
    try {
      const result = content();
      return Promise.resolve(String(result));
    } catch (error) {
      return Promise.resolve(`<!-- Error rendering: ${error} -->`);
    }
  }
  return Promise.resolve(String(content));
}

console.log('Baraqex - powered by Frontend Hamroun Framework with additional utilities');

