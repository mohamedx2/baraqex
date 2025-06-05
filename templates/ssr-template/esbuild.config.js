import { build } from 'esbuild';

// Build client
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
});

// Build server
await build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  outfile: 'dist/server.js',
  platform: 'node',
  format: 'esm',
  external: ['frontend-hamroun'],
  packages: 'external',
  minify: false,
  jsx: 'transform',
  jsxFactory: 'jsx',
  jsxFragment: 'Fragment',
  inject: ['./jsx-shim.js'],
});

console.log('Build completed successfully!');
