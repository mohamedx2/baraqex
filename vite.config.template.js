/**
 * Template Vite configuration for projects using baraqex
 * Copy this to your project as vite.config.js
 */
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    // Exclude server-only packages from pre-bundling
    exclude: [
      'express',
      'cors', 
      'mongodb',
      'mysql2',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
      'cookie-signature',
      'etag',
      'helmet',
      'compression'
    ],
    // Include baraqex browser build
    include: [
      'baraqex/browser'
    ]
  },
  resolve: {
    alias: {
      // Use browser-specific build of baraqex
      'baraqex': 'baraqex/browser'
    },
    conditions: ['browser', 'module', 'import']
  },
  build: {
    rollupOptions: {
      external: [
        // Mark server dependencies as external for browser builds
        'express',
        'cors',
        'mongodb', 
        'mysql2',
        'pg',
        'bcryptjs',
        'jsonwebtoken',
        'cookie-signature',
        'etag',
        'helmet',
        'compression',
        'crypto',
        'fs',
        'path',
        'http',
        'https',
        'net',
        'os'
      ]
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
