import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  esbuild: {
    jsx: 'transform',
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxImportSource: 'frontend-hamroun',
  },
  optimizeDeps: {
    include: ['frontend-hamroun'],
    exclude: []
  },
  server: {
    fs: {
      allow: ['..', '../..']
    },
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  },
  resolve: {
    alias: {
      'frontend-hamroun/jsx-dev-runtime': 'frontend-hamroun',
      'frontend-hamroun/jsx-runtime': 'frontend-hamroun'
    }
  }
});
