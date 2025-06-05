import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      // Polyfill Node.js built-ins for browser
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      buffer: 'buffer',
      process: 'process/browser',
      util: 'util',
      fs: 'memfs',
      path: 'path-browserify',
      events: 'events',
      url: 'url',
      querystring: 'querystring-es3',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify',
      assert: 'assert',
      timers: 'timers-browserify',
      zlib: 'browserify-zlib',
      tty: 'tty-browserify',
      constants: 'constants-browserify',
      vm: 'vm-browserify',
      child_process: false,
      cluster: false,
      dgram: false,
      dns: false,
      domain: false,
      inspector: false,
      module: false,
      net: false,
      perf_hooks: false,
      readline: false,
      repl: false,
      tls: false,
      worker_threads: false,
    },
  },
  optimizeDeps: {
    // Exclude server-only packages from browser bundling
    exclude: [
      'mongodb',
      'mysql2',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
      'express',
      'cors',
      'fs',
      'path',
      'crypto',
      'http',
      'https',
      'net',
      'child_process',
      'cluster',
      'os'
    ],
    // Include polyfills that should be pre-bundled
    include: [
      'crypto-browserify',
      'stream-browserify',
      'buffer',
      'process/browser',
      'util',
      'events',
      'url',
      'path-browserify'
    ],
    esbuildOptions: {
      // Define global for esbuild
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [
        // Mark server-only packages as external
        'mongodb',
        'mysql2',
        'pg',
        'bcryptjs',
        'jsonwebtoken',
        'express',
        'cors',
        'fs',
        'path',
        'crypto',
        'http',
        'https',
        'net',
        'child_process',
        'cluster',
        'os'
      ],
    },
  },
  server: {
    fs: {
      allow: ['..']
    }
  },
  ssr: {
    // Don't externalize these for SSR
    noExternal: [
      'frontend-hamroun'
    ],
    external: [
      'mongodb',
      'mysql2',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
      'express',
      'cors'
    ]
  }
});
