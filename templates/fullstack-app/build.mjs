import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientEntry = path.join(__dirname, 'src', 'main.tsx');
const serverEntry = path.join(__dirname, 'server.ts');
const outdir = path.join(__dirname, 'dist');
const buildDir = path.join(outdir, 'build');

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await fs.mkdir(dir, { recursive: true });
  }
}

// Tailwind + Autoprefixer postcss plugin for esbuild
const cssPlugin = {
  name: 'css-processor',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.readFile(args.path, 'utf8');
      if (!args.path.includes('styles')) {
        return { contents: css, loader: 'css' };
      }
      try {
        const result = await postcss([tailwindcss, autoprefixer]).process(css, {
          from: args.path
        });
        return { contents: result.css, loader: 'css' };
      } catch (error) {
        console.error('Error processing CSS:', error);
        return { errors: [{ text: 'CSS processing error: ' + error.message }], loader: 'css' };
      }
    });
  }
};

async function copyPublicFiles() {
  const publicDir = path.join(__dirname, 'public');
  if (!existsSync(publicDir)) return;
  const dest = path.join(outdir, 'public');
  await ensureDir(dest);
  await fs.cp(publicDir, dest, { recursive: true });
  console.log('✅ Public assets copied to dist/public');
}

async function buildClient() {
  console.log('🚀 Building client...');
  await ensureDir(buildDir);
  await esbuild.build({
    entryPoints: [clientEntry],
    bundle: true,
    minify: process.env.NODE_ENV === 'production',
    format: 'esm',
    outfile: path.join(buildDir, 'main.js'),
    jsx: 'transform',
    jsxFactory: 'jsx',
    jsxFragment: 'Fragment',
    loader: { '.tsx': 'tsx', '.ts': 'ts', '.jsx': 'jsx', '.js': 'js', '.css': 'css', '.json': 'json' },
    plugins: [
      {
        name: 'baraqex-jsx',
        setup(build) {
          build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
            const source = await fs.readFile(args.path, 'utf8');
            const content = `import { jsx, Fragment } from 'baraqex';\n${source}`;
            return { contents: content, loader: args.path.endsWith('tsx') ? 'tsx' : 'jsx' };
          });
        }
      }
    ],
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') },
    sourcemap: true,
    target: ['es2020']
  });

  // Build the Tailwind styles as a separate CSS file for SSR initial paint
  await esbuild.build({
    entryPoints: [path.join(__dirname, 'src', 'styles.css')],
    bundle: true,
    outfile: path.join(buildDir, 'styles.css'),
    plugins: [cssPlugin],
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') },
    minify: process.env.NODE_ENV === 'production'
  });

  console.log('✅ Client build complete');
}

async function buildServer() {
  console.log('🚀 Building server...');
  await esbuild.build({
    entryPoints: [serverEntry],
    bundle: true,
    platform: 'node',
    target: ['node18'],
    format: 'esm',
    outfile: path.join(outdir, 'server.js'),
    external: ['express', 'cors', 'compression', 'socket.io', 'dotenv'],
    plugins: [
      {
        name: 'external-all',
        setup(build) {
          build.onResolve({ filter: /^baraqex/ }, () => ({ external: true }));
        }
      }
    ],
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') },
    sourcemap: false
  });
  console.log('✅ Server build complete');
}

async function build() {
  console.log('🔨 Starting fullstack build...');
  await ensureDir(outdir);
  await Promise.all([copyPublicFiles(), buildClient(), buildServer()]);
  await fs.copyFile(path.join(__dirname, 'index.html'), path.join(outdir, 'index.html'));
  console.log('🎉 Build complete! Run `npm run start` to launch.');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
