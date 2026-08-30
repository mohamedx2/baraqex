import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Server configuration
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  
  // Using jsx transform with frontend-hamroun's jsx function
  esbuild: {
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    jsxInject: `import { jsx, Fragment } from 'frontend-hamroun'` 
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Generate SPA-friendly build that works with client-side routing
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['frontend-hamroun']
        }
      }
    },
    // Make sure CSS is properly processed
    cssCodeSplit: true
  },
  
  // CSS preprocessing
  css: {
    postcss: './postcss.config.js',
    // Include module CSS as well as global CSS
    modules: {
      scopeBehaviour: 'local',
      localsConvention: 'camelCaseOnly',
    }
  },
  
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@utils': resolve(__dirname, 'src/utils')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['frontend-hamroun']
  },
  
  // This is a critical plugin for SPA routing - much simpler than before
  plugins: [{
    name: 'spa-fallback',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          if (req.url.includes('.') || req.url.startsWith('/api/') || req.url.startsWith('/socket.io/')) {
            next();
            return;
          }
          
          console.log(`[SPA] Handling route: ${req.url}`);
          req.url = '/'; // Rewrite all routes to root
          next();
        });
      };
    }
  }]
});
