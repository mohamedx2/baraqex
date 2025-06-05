import { build } from 'esbuild';

// Build client - use browser-compatible baraqex
await build({
  entryPoints: ['src/client.tsx'],
  bundle: true,
  outfile: 'dist/client.js',
  platform: 'browser',
  format: 'esm',
  minify: false,
  jsx: 'transform',
  jsxFactory: 'jsx',
  jsxFragment: 'Fragment',
  inject: ['./jsx-shim.js'],
  external: [
    // Exclude server dependencies from browser build
    'express',
    'cors',
    'mongodb',
    'mysql2',
    'pg',
    'bcryptjs',
    'jsonwebtoken',
    'crypto',
    'fs',
    'path',
    'http',
    'https'
  ],
  alias: {
    // Use browser build of baraqex
    'baraqex': 'baraqex/browser'
  }
});

// Build server - use full baraqex with server capabilities
await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  outfile: 'dist/server.js',
  platform: 'node',
  format: 'esm',
  external: [
    'baraqex',
    'frontend-hamroun',
    'express',
    'cors',
    'mongodb',
    'mysql2',
    'pg',
    'bcryptjs',
    'jsonwebtoken'
  ],
  packages: 'external',
  minify: false,
  jsx: 'transform',
  jsxFactory: 'jsx',
  jsxFragment: 'Fragment',
  inject: ['./jsx-shim.js'],
});

console.log('Build completed successfully!');
