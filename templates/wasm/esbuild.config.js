import esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Build client
await esbuild.build({
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
await esbuild.build({
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

const config = {
  entryPoints: ['src/index.js'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  target: 'es2020',
  minify: process.env.NODE_ENV === 'production',
  sourcemap: process.env.NODE_ENV !== 'production',
  platform: 'browser',
  loader: {
    '.wasm': 'file'
  },
  external: [],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('Watching for changes...');
} else {
  await esbuild.build(config);
  console.log('Build complete!');
}
