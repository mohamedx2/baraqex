import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const config = {
  entryPoints: ['src/main.tsx'],
  bundle: true,
  outfile: 'dist/bundle.js',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  minify: !isWatch,
  sourcemap: isWatch,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  },
  external: [],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'tsx',
    '.jsx': 'jsx',
    '.js': 'jsx',
    '.css': 'css'
  },
  // Don't transform JSX since we're using jsx() function calls
  jsx: 'preserve'
};

if (isWatch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
  console.log('👀 Watching for changes...');
  console.log('📦 Bundle will be rebuilt automatically');
} else {
  await esbuild.build(config);
  console.log('✅ Build complete');
}
