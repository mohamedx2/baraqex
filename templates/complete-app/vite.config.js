import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Configure JSX
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'Fragment',
    jsxInject: `import { createElement, Fragment } from 'frontend-hamroun'`
  },

  // Configure build
  build: {
    outDir: 'dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'src/client.ts')
      },
      output: [
        {
          // ESM output
          entryFileNames: 'assets/[name].mjs',
          chunkFileNames: 'assets/[name]-[hash].mjs',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          format: 'es',
        },
        {
          // CommonJS output
          entryFileNames: 'assets/[name].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          format: 'cjs',
        }
      ]
    }
  },

  // Add optimizations for frontend-hamroun
  optimizeDeps: {
    include: ['frontend-hamroun']
  },

  // Resolve aliases for better imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // Development server
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
});
