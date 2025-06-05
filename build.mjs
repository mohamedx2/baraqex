import { build } from 'esbuild';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';

// Build configurations
const baseConfig = {
  bundle: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  minify: false,
  platform: 'neutral'
};

// Browser build - excludes all server dependencies
const browserConfig = {
  ...baseConfig,
  entryPoints: ['src/browser.ts'],
  outfile: 'dist/browser.js',
  platform: 'browser',
  external: [
    // Node.js built-ins - exclude completely from browser build
    'crypto', 'fs', 'path', 'http', 'https', 'net', 'os', 'child_process',
    'cluster', 'stream', 'util', 'events', 'url', 'querystring', 'buffer',
    'timers', 'zlib', 'tty', 'constants', 'vm', 'dns', 'domain', 'inspector',
    'module', 'perf_hooks', 'readline', 'repl', 'tls', 'worker_threads',
    // Server dependencies
    'express', 'cors', 'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
    'etag', 'cookie-signature', 'cookie-parser', 'body-parser', 'helmet'
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'globalThis'
  }
};

// Server build - includes all dependencies
const serverConfig = {
  ...baseConfig,
  entryPoints: ['src/server/index.ts'],
  outdir: 'dist/server',
  platform: 'node',
  external: [
    // Keep Node.js built-ins as external
    'crypto', 'fs', 'path', 'http', 'https', 'net', 'os', 'child_process',
    'cluster', 'stream', 'util', 'events', 'url', 'querystring', 'buffer',
    'timers', 'zlib', 'tty', 'constants', 'vm', 'dns', 'domain', 'inspector',
    'module', 'perf_hooks', 'readline', 'repl', 'tls', 'worker_threads',
    // Server dependencies that should be provided by the user
    'express', 'cors', 'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken'
  ]
};

// WASM build - browser compatible
const wasmConfig = {
  ...baseConfig,
  entryPoints: ['src/wasm.ts'],
  outfile: 'dist/wasm.js',
  platform: 'browser',
  external: [
    // Exclude server dependencies
    'express', 'cors', 'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
    'crypto', 'fs', 'path', 'http', 'https'
  ]
};

// Main entry build - conditional loading
const mainConfig = {
  ...baseConfig,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  platform: 'neutral',
  external: [
    // All server dependencies are external
    'express', 'cors', 'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
    // Node.js built-ins
    'crypto', 'fs', 'path', 'http', 'https', 'net', 'os', 'child_process',
    'cluster', 'stream', 'util', 'events', 'url', 'querystring', 'buffer',
    'timers', 'zlib', 'tty', 'constants', 'vm', 'dns', 'domain', 'inspector',
    'module', 'perf_hooks', 'readline', 'repl', 'tls', 'worker_threads'
  ],
  define: {
    'global': 'globalThis'
  }
};

async function buildAll() {
  try {
    console.log('🧹 Cleaning dist directory...');
    
    console.log('📝 Generating TypeScript declarations...');
    // Generate TypeScript declarations first
    try {
      execSync('npx tsc --emitDeclarationOnly', { stdio: 'inherit' });
      console.log('✅ TypeScript declarations generated');
    } catch (error) {
      console.error('❌ TypeScript declaration generation failed:', error.message);
      process.exit(1);
    }

    console.log('🔨 Building browser bundle...');
    await build(browserConfig);
    console.log('✅ Browser bundle built');

    console.log('🔨 Building server bundle...');
    await build(serverConfig);
    console.log('✅ Server bundle built');

    console.log('🔨 Building WASM bundle...');
    await build(wasmConfig);
    console.log('✅ WASM bundle built');

    console.log('🔨 Building main entry...');
    await build(mainConfig);
    console.log('✅ Main entry built');

    // Create package.json files for different entry points
    createPackageJsonFiles();
    
    // Fix declaration file mappings
    fixDeclarationFiles();

    console.log('🎉 All builds completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

function createPackageJsonFiles() {
  // Ensure dist directory exists
  try {
    mkdirSync('dist', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Create browser package.json
  const browserPackage = {
    type: 'module',
    sideEffects: false
  };
  writeFileSync('dist/browser.package.json', JSON.stringify(browserPackage, null, 2));

  // Ensure server directory exists
  try {
    mkdirSync('dist/server', { recursive: true });
  } catch (error) {
    // Directory might already exist
  }

  // Create server package.json
  const serverPackage = {
    type: 'module',
    sideEffects: false
  };
  writeFileSync('dist/server/package.json', JSON.stringify(serverPackage, null, 2));
}

function fixDeclarationFiles() {
  // Copy browser.d.ts to match the browser.js output
  if (existsSync('dist/browser.d.ts')) {
    console.log('✅ Browser declaration file exists');
  } else {
    console.warn('⚠️ Browser declaration file not found, creating fallback...');
    // Create a fallback declaration file
    const browserDeclaration = `export * from 'frontend-hamroun';
export { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions, useGoWasm } from './wasm';
export type { GoWasmOptions, GoWasmInstance } from './wasm';
export { generateDocument, generateErrorPage, generateLoadingPage } from './server/templates';
export function renderToString(content: any): Promise<string>;
export function generateToken(length?: number): string;
export function safeJsonParse<T>(json: string, fallback: T): T;
export const isBrowser: boolean;
export const isNode: boolean;
`;
    writeFileSync('dist/browser.d.ts', browserDeclaration);
  }
  
  // Ensure WASM declarations exist
  if (!existsSync('dist/wasm.d.ts')) {
    console.warn('⚠️ WASM declaration file not found, creating fallback...');
    const wasmDeclaration = `export interface GoWasmOptions {
  debug?: boolean;
  goWasmPath?: string;
  importObject?: any;
  onLoad?: (instance: GoWasmInstance) => void;
}

export interface GoWasmInstance {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  exports: WebAssembly.Exports;
  functions: Record<string, Function>;
}

export function loadGoWasm(wasmUrl: string, options?: GoWasmOptions): Promise<GoWasmInstance>;
export function callWasmFunction(funcName: string, ...args: any[]): any;
export function isWasmReady(): boolean;
export function getWasmFunctions(): string[];
export function useGoWasm(wasmUrl: string, options?: GoWasmOptions): {
  loadWasm: () => Promise<GoWasmInstance>;
  callFunction: typeof callWasmFunction;
  isReady: typeof isWasmReady;
  getFunctions: typeof getWasmFunctions;
};

declare global {
  interface Window {
    Go: new () => {
      importObject: any;
      run: (instance: WebAssembly.Instance) => void;
    };
    [key: string]: any;
  }
}
`;
    writeFileSync('dist/wasm.d.ts', wasmDeclaration);
  }
}

buildAll();
