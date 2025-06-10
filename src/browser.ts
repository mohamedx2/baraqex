/**
 * Browser-specific exports for Baraqex
 * This file is used when building for the browser
 */

// Re-export everything from frontend-hamroun for browser usage
export * from 'frontend-hamroun';

// Export WASM functionality (browser-only functions)
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';
export type { GoWasmOptions, GoWasmInstance } from './wasm.js';

// Export safe utilities that work in browser
export const safeJsonParse = (json: string, fallback: any) => {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
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
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Browser-safe template utilities
export const generateDocument = (content: string, options: any = {}) => 
  `<!DOCTYPE html><html><head><title>${options.title || 'App'}</title></head><body>${content}</body></html>`;

export const generateErrorPage = (code: number, message: string) => 
  `<div>Error ${code}: ${message}</div>`;

export const generateLoadingPage = (message: string = 'Loading...') => 
  `<div>${message}</div>`;

// Simple renderToString for browser compatibility
export const renderToString = (component: any): string => {
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

// Stub server functions for browser (they will throw if called)
export const createServer = () => {
  throw new Error('createServer is not available in browser environment');
};

export const createDevServer = () => {
  throw new Error('createDevServer is not available in browser environment');
};

export const createProductionServer = () => {
  throw new Error('createProductionServer is not available in browser environment');
};

// Export null stubs for server-only functionality
export const BaraqexServer = null;
export const Database = null;
export const AuthService = null;
export const ApiRouter = null;
export const requestLogger = null;
export const errorHandler = null;
export const notFoundHandler = null;
export const rateLimit = null;
export const initNodeWasm = null;
export const loadGoWasmFromFile = null;
export const hashString = null;
export const getPagination = null;
export const sendSuccess = null;
export const sendError = null;
export const validateFields = null;
export const validateFileUpload = null;
export const getEnvironmentInfo = null;
export const isDirectoryEmpty = null;
export const ensureDirectory = null;
export const writeJsonFile = null;
export const readJsonFile = null;
export const baraqexRenderToString = null;
export const renderComponent = null;

console.log('Baraqex - Browser build loaded');
