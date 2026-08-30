import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Build configuration
const clientEntry = path.join(__dirname, 'src', 'main.tsx');
const serverEntry = path.join(__dirname, 'server.ts');
const outdir = path.join(__dirname, 'dist');

// Ensure output directory exists
if (!existsSync(outdir)) {
  await fs.mkdir(outdir, { recursive: true });
}

// CSS processing plugin for esbuild
const cssPlugin = {
  name: 'css-processor',
  setup(build: { onLoad: (arg0: { filter: RegExp; }, arg1: (args: any) => Promise<{ contents: string; loader: string; errors?: undefined; } | { errors: { text: string; }[]; loader: string; contents?: undefined; }>) => void; }) {
    // Handle CSS files
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      // Read the CSS file
      const css = await fs.readFile(args.path, 'utf8');
      
      // Process with PostCSS (Tailwind + Autoprefixer)
      try {
        const result = await postcss([
          tailwindcss,
          autoprefixer
        ]).process(css, { 
          from: args.path,
          to: path.join(outdir, 'build', 'styles.css')
        });
        
        // Return processed CSS
        return {
          contents: result.css,
          loader: 'css'
        };
      } catch (error: any) {
        console.error('Error processing CSS:', error);
        return { 
          errors: [{ text: 'Error processing CSS with PostCSS: ' + error.message }],
          loader: 'css'
        };
      }
    });
  }
};

// Copy static files
async function copyPublicFiles() {
  const publicDir = path.join(__dirname, 'public');
  const publicOutDir = path.join(outdir, 'public');
  
  if (existsSync(publicDir)) {
    if (!existsSync(publicOutDir)) {
      await fs.mkdir(publicOutDir, { recursive: true });
    }
    
    // Read all files in public directory
    const files = await fs.readdir(publicDir, { withFileTypes: true });
    
    // Copy each file
    for (const file of files) {
      const srcPath = path.join(publicDir, file.name);
      const destPath = path.join(publicOutDir, file.name);
      
      if (file.isDirectory()) {
        // Copy directory recursively
        await fs.cp(srcPath, destPath, { recursive: true });
      } else {
        // Copy file
        await fs.copyFile(srcPath, destPath);
      }
    }
    
    console.log('✓ Public files copied to dist/public');
  }
  
  // Copy index.html
  const indexPath = path.join(__dirname, 'index.html');
  if (existsSync(indexPath)) {
    await fs.copyFile(indexPath, path.join(outdir, 'index.html'));
    console.log('✓ index.html copied to dist');
  }
}

// Build client-side code
async function buildClient() {
  console.log('Building client...');
  
  try {
    await esbuild.build({
      entryPoints: [clientEntry],
      bundle: true,
      minify: true,
      format: 'esm',
      outfile: path.join(outdir, 'build', 'main.js'),
      jsx: 'automatic',
      jsxFactory: 'jsx',
      jsxFragment: 'Fragment',
      plugins: [
        {
          name: 'jsx-runtime-import',
          setup(build) {
            build.onLoad({ filter: /\.(tsx|jsx)$/ }, async (args) => {
              const source = await fs.readFile(args.path, 'utf8');
              const content = `import { jsx, Fragment } from 'frontend-hamroun';\n${source}`;
              return { contents: content, loader: args.path.endsWith('tsx') ? 'tsx' : 'jsx' };
            });
          }
        }
      ],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js',
        '.css': 'css',
        '.json': 'json',
        '.png': 'file',
        '.jpg': 'file',
        '.svg': 'file'
      },
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      sourcemap: false,
      metafile: true
    });
    
    console.log('✓ Client build complete');
  } catch (error) {
    console.error('Client build failed:', error);
    process.exit(1);
  }
}

// Build server-side code
async function buildServer() {
  console.log('Building server...');
  
  try {
    await esbuild.build({
      entryPoints: [serverEntry],
      bundle: true,
      platform: 'node',
      target: ['node16'],
      outfile: path.join(outdir, 'server.js'),
      format: 'esm',
      jsx: 'automatic',
      jsxFactory: 'jsx',
      jsxFragment: 'Fragment',
      plugins: [{
        name: 'external-modules',
        setup(build) {
          // Mark node_modules as external to reduce bundle size
          build.onResolve({ filter: /^[^./]/ }, args => {
            return { external: true };
          });
        }
      }],
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      sourcemap: false
    });
    
    console.log('✓ Server build complete');
  } catch (error) {
    console.error('Server build failed:', error);
    process.exit(1);
  }
}

// Run the build process
async function build() {
  console.log('🔨 Starting production build...');
  
  // Create build directory for client assets
  const buildDir = path.join(outdir, 'build');
  if (!existsSync(buildDir)) {
    await fs.mkdir(buildDir, { recursive: true });
  }
  
  // Run build steps in parallel
  await Promise.all([
    copyPublicFiles(),
    buildClient(),
    buildServer()
  ]);
  
  console.log('✅ Production build complete!');
  console.log(`Run 'npm run serve' to start the production server.`);
}

// Execute the build
build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
