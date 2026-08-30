import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const outputDir = path.join(__dirname, 'dist');

// Ensure output directory exists
fs.ensureDirSync(outputDir);

// Copy necessary files for production
console.log('Copying files for production...');

// Copy HTML template
fs.copySync(path.join(__dirname, 'public', 'index.html'), path.join(outputDir, 'index.html'));

// Copy WASM files
const wasmDir = path.join(__dirname, 'public', 'wasm');
const distWasmDir = path.join(outputDir, 'wasm');
fs.ensureDirSync(distWasmDir);

if (fs.existsSync(wasmDir)) {
  fs.copySync(wasmDir, distWasmDir);
  console.log('Copied WASM files to:', distWasmDir);
} else {
  console.warn('WASM directory not found:', wasmDir);
}

// Copy client.js for hydration
const srcDir = path.join(__dirname, 'src');
const distSrcDir = path.join(outputDir, 'src');
fs.ensureDirSync(distSrcDir);
fs.copySync(path.join(srcDir, 'client.js'), path.join(distSrcDir, 'client.js'));

// Copy any other static assets
const publicDir = path.join(__dirname, 'public');
fs.readdirSync(publicDir).forEach(file => {
  if (file !== 'index.html' && file !== 'wasm') {
    const srcPath = path.join(publicDir, file);
    const destPath = path.join(outputDir, file);
    fs.copySync(srcPath, destPath);
  }
});

console.log('Build completed successfully.');
