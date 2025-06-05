import { build } from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';

// Browser build configuration
const browserConfig = {
  entryPoints: ['src/wasm.ts'],
  bundle: true,
  outfile: 'dist/wasm.js',
  platform: 'browser',
  format: 'esm',
  target: 'es2020',
  minify: false,
  sourcemap: true,
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'globalThis',
  },
  inject: ['./polyfills/browser-polyfills.js'],
  alias: {
    crypto: 'crypto-browserify',
    stream: 'stream-browserify',
    buffer: 'buffer',
    process: 'process/browser',
    util: 'util',
    fs: 'memfs',
    path: 'path-browserify',
    events: 'events',
    url: 'url',
  },
  external: [
    // Server-only packages that should never be bundled for browser
    'mongodb',
    'mysql2',
    'pg',
    'bcryptjs',
    'jsonwebtoken',
    'express',
    'cors',
    'child_process',
    'cluster',
    'net',
    'tls',
    'dns',
    'os',
    'http',
    'https'
  ]
};

// Server build configuration
const serverConfig = {
  entryPoints: ['src/server/wasm.ts', 'src/server/index.ts'],
  bundle: true,
  outdir: 'dist/server',
  platform: 'node',
  format: 'esm',
  target: 'node16',
  minify: false,
  sourcemap: true,
  packages: 'external',
  plugins: [nodeExternalsPlugin()],
  external: [
    // Keep Node.js built-ins as external
    'fs',
    'path',
    'crypto',
    'http',
    'https',
    'net',
    'os',
    'child_process',
    'cluster',
    'stream',
    'util',
    'events',
    'url',
    'querystring',
    'buffer',
    'timers',
    'zlib',
    'tty',
    'constants',
    'vm',
    'dns',
    'domain',
    'inspector',
    'module',
    'perf_hooks',
    'readline',
    'repl',
    'tls',
    'worker_threads',
    // Server dependencies
    'mongodb',
    'mysql2',
    'pg',
    'bcryptjs',
    'jsonwebtoken',
    'express',
    'cors'
  ]
};

// Build both configurations
async function buildAll() {
  try {
    console.log('Building browser bundle...');
    await build(browserConfig);
    console.log('✅ Browser bundle built successfully');
    
    console.log('Building server bundle...');
    await build(serverConfig);
    console.log('✅ Server bundle built successfully');
    
    console.log('🎉 All builds completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildAll();
