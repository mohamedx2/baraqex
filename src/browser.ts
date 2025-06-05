/**
 * Browser-only entry point for baraqex
 * This file excludes all server dependencies to ensure browser compatibility
 */

// Re-export everything from frontend-hamroun
export * from 'frontend-hamroun';

// Export browser-compatible WASM functionality
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm.js';

// Export type definitions (safe for all environments)
export type { GoWasmOptions, GoWasmInstance } from './wasm.js';

// Export basic template utilities (no server dependencies)
// Create browser-safe versions of template functions
export function generateDocument(content: string, options: any = {}): string {
  const { title = 'App', description = '', styles = [], scripts = [] } = options;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${description ? `<meta name="description" content="${escapeHtml(description)}">` : ''}
  ${styles.map((href: string) => `<link rel="stylesheet" href="${escapeHtml(href)}">`).join('\n  ')}
</head>
<body>
  <div id="app-root">${content}</div>
  ${scripts.map((src: string) => `<script src="${escapeHtml(src)}" defer></script>`).join('\n  ')}
</body>
</html>`;
}

export function generateErrorPage(statusCode: number, message: string): string {
  return generateDocument(`
    <div style="text-align: center; padding: 2rem;">
      <h1>${statusCode}</h1>
      <p>${escapeHtml(message)}</p>
      <a href="/">Back to Home</a>
    </div>
  `, { title: `Error ${statusCode}` });
}

export function generateLoadingPage(message: string = 'Loading...'): string {
  return generateDocument(`
    <div style="text-align: center; padding: 2rem;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p>${escapeHtml(message)}</p>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </div>
  `, { title: 'Loading' });
}

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Simple renderToString function for browser SSR compatibility
export function renderToString(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (typeof content === 'function') {
    try {
      const result = content();
      return String(result);
    } catch (error) {
      return `<!-- Error rendering: ${error} -->`;
    }
  }
  return String(content);
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

// Export stubs for server-only functions to prevent import errors
export const Server = null;
export const createServer = null;
export const createDevServer = null;
export const createProductionServer = null;
export const Database = null;
export const AuthService = null;
export const ApiRouter = null;
export const requestLogger = null;
export const errorHandler = null;
export const notFoundHandler = null;
export const rateLimit = null;
export const initNodeWasm = null;
export const loadGoWasmFromFile = null;

console.log('Baraqex - Browser version loaded');
