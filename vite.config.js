import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
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
    exclude: [
      'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
      'express', 'cors', 'fs', 'path', 'crypto', 'http', 'https',
      'net', 'child_process', 'cluster', 'os'
    ],
    include: [
      'crypto-browserify', 'stream-browserify', 'buffer',
      'process/browser', 'util', 'events', 'url', 'path-browserify'
    ],
    esbuildOptions: {
      define: { global: 'globalThis' },
    },
  },
  build: {
    target: 'esnext',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        browser: resolve(__dirname, 'src/browser.ts'),
        'jsx-runtime': resolve(__dirname, 'src/core/jsx-runtime.ts'),
        hooks: resolve(__dirname, 'src/core/hooks.ts'),
        renderer: resolve(__dirname, 'src/core/renderer.ts'),
        'server-renderer': resolve(__dirname, 'src/core/server-renderer.ts'),
        wasm: resolve(__dirname, 'src/wasm.ts'),
        batch: resolve(__dirname, 'src/core/batch.ts'),
        context: resolve(__dirname, 'src/core/context.ts'),
        types: resolve(__dirname, 'src/core/types.ts'),
        component: resolve(__dirname, 'src/core/component.ts'),
        vdom: resolve(__dirname, 'src/core/vdom.ts'),
        router: resolve(__dirname, 'src/core/router.ts'),
        store: resolve(__dirname, 'src/core/store.ts'),
        utils: resolve(__dirname, 'src/core/utils.ts'),
        'lifecycle-events': resolve(__dirname, 'src/core/lifecycle-events.ts'),
        forms: resolve(__dirname, 'src/core/forms.ts'),
        'event-bus': resolve(__dirname, 'src/core/event-bus.ts'),
        errors: resolve(__dirname, 'src/core/errors.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs';
        return `${entryName}.${ext}`;
      }
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: [
        'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
        'express', 'cors', 'fs', 'path', 'crypto', 'http', 'https',
        'net', 'child_process', 'cluster', 'os'
      ],
      output: {
        preserveModules: true,
        exports: 'named',
        preserveModulesRoot: 'src',
      }
    },
    sourcemap: true,
  },
  server: {
    fs: { allow: ['..'] }
  },
  ssr: {
    noExternal: ['baraqex'],
    external: [
      'mongodb', 'mysql2', 'pg', 'bcryptjs', 'jsonwebtoken',
      'express', 'cors'
    ]
  }
});
