import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject: `import { jsx } from 'baraqex';`
  },
  define: {
    // Ensure we're in browser mode
    'process.env.NODE_ENV': JSON.stringify('development'),
    'typeof window': '"object"',
    'global': 'globalThis'
  },
  optimizeDeps: {
    // Exclude ALL server-only dependencies from browser bundle
    exclude: [
      // Only exclude actual server modules that would cause issues
      'express',
      'mysql2',
      'mongodb',
      'pg',
      'bcryptjs',
      'jsonwebtoken',
      'cors'
    ],
    // Force include browser-safe modules
    include: [
      'frontend-hamroun',
      'baraqex'
    ]
  },
  resolve: {
    alias: {
      // Only alias problematic Node.js built-ins, not everything
      'fs': false,
      'path': false,
      'http': false,
      'https': false,
      'url': false,
      'os': false,
      'crypto': false
    },
    // Only use browser-compatible fields
    mainFields: ['browser', 'module', 'main']
  },
  server: {
    hmr: {
      overlay: true
    },
    fs: {
      // Allow serving files from the project root
      allow: ['..']
    }
  }
});
