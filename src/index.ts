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
export { renderToString as baraqexRenderToString, hydrate as baraqexHydrate } from './server-renderer.js';

// Export middleware functions
export { requestLogger, errorHandler, notFoundHandler, rateLimit } from './server/middleware.js';

// Export WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';
export type { GoWasmOptions, GoWasmInstance } from './wasm.js';

console.log('Baraqex - powered by Frontend Hamroun Framework with additional utilities');

