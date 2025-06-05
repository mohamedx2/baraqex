import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

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
    // Node.js built-ins
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

    console.log('🎉 All builds completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

function createPackageJsonFiles() {
  // Create browser package.json
  const browserPackage = {
    type: 'module',
    sideEffects: false
  };
  writeFileSync('dist/browser.package.json', JSON.stringify(browserPackage, null, 2));

  // Create server package.json
  const serverPackage = {
    type: 'module',
    sideEffects: false
  };
  writeFileSync('dist/server/package.json', JSON.stringify(serverPackage, null, 2));
}

buildAll();
