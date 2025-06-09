import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'frontend-hamroun': path.resolve(__dirname, 'node_modules/frontend-hamroun')
    }
  },
  build: {
    outDir: 'dist',
    ssr: 'src/server.ts',
    rollupOptions: {
      input: {
        client: './src/client.tsx',
        server: './src/server.ts'
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      // Exclude WASM build script from hot reload and external dependencies
      external: ['./build-wasm.js']
    },
    target: 'esnext'
  },
  esbuild: {
    jsxFactory: '_jsx',
    jsxFragment: '_Fragment',
    jsxInject: `import { jsx as _jsx, Fragment as _Fragment } from 'frontend-hamroun'`
  },
  server: {
    fs: {
      allow: ['..']
    },
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    watch: {
      // Prevent watching go directory and wasm files to avoid infinite loops
      ignored: [
        '**/go/**',
        '**/*.wasm',
        '**/build-wasm.js',
        '**/wasm_exec.js'
      ]
    }
  },
  optimizeDeps: {
    exclude: ['frontend-hamroun']
  },
  // Prevent Vite from processing WASM files
  assetsInclude: ['**/*.wasm']
});
