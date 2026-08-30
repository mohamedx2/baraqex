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
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        client: resolve(__dirname, 'src/client.js')
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

  // Resolve aliases for better imports
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});
