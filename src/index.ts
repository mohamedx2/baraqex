/**
 * Baraqex — main entry point (universal)
 *
 * Re-exports everything from core (standalone, no external dependencies).
 * Server modules are loaded lazily on first access — no race conditions.
 */

// Core framework (universal — browser + Node.js)
export * from './core/index.js';

// Type definitions (safe for all environments)
export type { ServerConfig, User, DbConfig, MiddlewareFunction } from './server/types.js';
export type { GoWasmOptions, GoWasmInstance } from './server/types.js';

// WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';

// Browser-safe utilities (always available)
export const safeJsonParse = (json: string, fallback: any) => {
  try { return JSON.parse(json); } catch { return fallback; }
};

export const generateToken = (length: number = 32) => {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
};

export const generateDocument = (content: string, options: any = {}) =>
  `<!DOCTYPE html><html><head><title>${options.title || 'App'}</title></head><body>${content}</body></html>`;

export const generateErrorPage = (code: number, message: string) =>
  `<div>Error ${code}: ${message}</div>`;

export const generateLoadingPage = (message: string = 'Loading...') =>
  `<div>${message}</div>`;

export const fallbackRenderToString = (component: any): string => {
  try {
    if (typeof component === 'function') {
      const result = component();
      return typeof result === 'string' ? result : String(result || '');
    }
    return String(component || '');
  } catch {
    return '<div>Error rendering component</div>';
  }
};

// ---------------------------------------------------------------------------
// Server exports
//
// The dist build bundles the server module into this entry, so these are
// re-exported statically. Use `import ... from 'baraqex/server'` for the
// dedicated server build; these top-level names are provided for convenience
// and are only meaningful in a Node.js/Express environment.
// ---------------------------------------------------------------------------

export {
  createServer,
  createDevServer,
  createProductionServer,
  Server as BaraqexServer,
  renderComponent,
} from './server/index.js';

export { Database } from './server/database.js';
export { AuthService } from './server/auth.js';
export { ApiRouter } from './server/api-router.js';
export { initNodeWasm, loadGoWasmFromFile } from './server/wasm.js';

export {
  requestLogger,
  errorHandler,
  notFoundHandler,
  rateLimit,
} from './server/middleware.js';

export {
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
} from './server/utils.js';
