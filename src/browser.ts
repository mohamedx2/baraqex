/**
 * Browser-only entry point for baraqex
 * This file excludes all server dependencies to ensure browser compatibility
 */

// Re-export everything from frontend-hamroun
export * from 'frontend-hamroun';

// Export browser-compatible WASM functionality
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';

// Export type definitions (safe for all environments)
export type { GoWasmOptions, GoWasmInstance } from './server/types.js';

// Export basic template utilities (no server dependencies)
export { generateDocument, generateErrorPage, generateLoadingPage } from './server/templates.js';

// Simple renderToString function for browser SSR compatibility
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

// Browser-compatible utility functions
export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    return fallback;
  }
}

// Browser environment detection
export const isBrowser = typeof window !== 'undefined';
export const isNode = false; // Always false in browser build

console.log('Baraqex - Browser version loaded');
