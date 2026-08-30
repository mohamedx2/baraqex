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
      }
    }
  },
  esbuild: {
    jsxFactory: '_jsx',
    jsxFragment: '_Fragment',
    jsxInject: `import { jsx as _jsx, Fragment as _Fragment } from 'frontend-hamroun'`
  }
});
