import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  optimizeDeps: {
    exclude: [
      // Exclude Node.js-only packages from browser bundling
      'crypto',
      'mongodb', 
      'mysql2',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
      'cors',
      'express',
      'fs',
      'path',
      'url',
      'http',
      'https',
      'stream',
      'util',
      'events',
      'buffer',
      'assert',
      'child_process',
      'cluster',
      'dgram',
      'dns',
      'domain',
      'net',
      'os',
      'punycode',
      'querystring',
      'readline',
      'repl',
      'string_decoder',
      'sys',
      'timers',
      'tls',
      'tty',
      'vm',
      'worker_threads',
      'zlib'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  resolve: {
    alias: {
      // Provide browser-compatible alternatives
      buffer: 'buffer',
      process: 'process/browser'
    }
  }
});
