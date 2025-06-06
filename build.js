import { build } from 'esbuild';
import fs from 'fs';
import path from 'path';

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist', { recursive: true });

// Build configurations
const baseConfig = {
  bundle: true,
  minify: false,
  sourcemap: true,
  format: 'esm',
  target: 'es2020',
  platform: 'neutral'
};

// Main build (Node.js compatible)
const mainConfig = {
  ...baseConfig,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  platform: 'node',
  external: [
    'frontend-hamroun',
    'express',
    'cors',
    'mongodb',
    'mysql2',
    'pg', 
    'bcryptjs',
    'jsonwebtoken',
    'fs',
    'path',
    'http',
    'https',
    'url',
    'crypto',
    'os',
    'child_process',
    'events',
    'stream',
    'util',
    'fs/promises'
  ]
};

// Browser build (browser compatible)
const browserConfig = {
  ...baseConfig,
  entryPoints: ['src/wasm.ts'],
  outfile: 'dist/browser.js',
  platform: 'browser',
  globalName: 'Baraqex',
  external: [
    'frontend-hamroun'
  ],
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'globalThis'
  }
};

// Server build (Node.js only features)
const serverConfig = {
  ...baseConfig,
  entryPoints: ['src/server/index.ts'],
  outfile: 'dist/server.js', 
  platform: 'node',
  external: [
    'frontend-hamroun',
    'express',
    'cors',
    'mongodb',
    'mysql2',
    'pg',
    'bcryptjs', 
    'jsonwebtoken'
  ]
};

// WASM utilities build
const wasmConfig = {
  ...baseConfig,
  entryPoints: ['src/wasm.ts'],
  outfile: 'dist/wasm.js',
  platform: 'neutral',
  external: ['frontend-hamroun']
};

async function buildAll() {
  try {
    console.log('Building main package...');
    await build(mainConfig);
    
    console.log('Building browser package...');
    await build(browserConfig);
    
    console.log('Building server package...');
    await build(serverConfig);
    
    console.log('Building WASM utilities...');
    await build(wasmConfig);
    
    console.log('✅ All builds completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildAll();
