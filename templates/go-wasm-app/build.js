// Support both ESM and CommonJS imports
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const { execSync } = require('child_process');
const config = require('./build.config.js');

// Define colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m"
};

// Helper for formatted console logs
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = {
    info: `${colors.bright}${colors.cyan}[INFO]${colors.reset}`,
    success: `${colors.bright}${colors.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.bright}${colors.yellow}[WARNING]${colors.reset}`,
    error: `${colors.bright}${colors.red}[ERROR]${colors.reset}`
  };
  
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${prefix[type] || prefix.info} ${message}`);
}

// Main build function
async function build() {
  try {
    log(`Starting build process (${process.env.NODE_ENV || 'development'} mode)`);
    
    // Ensure output directories
    ensureDir(path.join(__dirname, 'dist'));
    ensureDir(path.join(__dirname, 'dist/server'));
    ensureDir(path.join(__dirname, 'dist/assets'));
    ensureDir(path.join(__dirname, 'public/wasm'));
    
    // Build the WASM modules if enabled
    if (config.wasm.enabled) {
      await buildWasmModules();
    }

    // Build the client code
    await buildClient();
    
    // Build the server code if it exists
    if (fs.existsSync(path.join(__dirname, config.entryPoints.server))) {
      await buildServer();
    }

    log('Build completed successfully', 'success');
  } catch (error) {
    log(`Build failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Build WebAssembly modules
async function buildWasmModules() {
  const sourceDir = path.join(__dirname, config.wasm.sourceDir);
  const outputDir = path.join(__dirname, config.wasm.outputDir);
  
  if (!fs.existsSync(sourceDir)) {
    log(`WASM source directory not found: ${sourceDir}`, 'warning');
    return;
  }
  
  log('Building WebAssembly modules...');
  
  // Get all .go files that need to be compiled
  const goFiles = fs.readdirSync(sourceDir)
    .filter(file => file.endsWith('.go'));
  
  if (goFiles.length === 0) {
    log('No Go files found to compile', 'warning');
    return;
  }
  
  // Compile each Go file to WASM
  for (const goFile of goFiles) {
    const goFilePath = path.join(sourceDir, goFile);
    const wasmFileName = goFile.replace('.go', '.wasm');
    const wasmFilePath = path.join(outputDir, wasmFileName);
    
    log(`Compiling ${goFile} to WebAssembly...`);
    
    try {
      // Set environment variables for Go WASM compilation
      const env = {
        ...process.env,
        GOOS: 'js',
        GOARCH: 'wasm'
      };
      
      // Compile Go to WASM
      execSync(`${config.wasm.goBinaryPath} build -o "${wasmFilePath}" "${goFilePath}"`, {
        env,
        stdio: 'inherit'
      });
      
      log(`Successfully compiled ${goFile} to ${wasmFileName}`, 'success');
    } catch (error) {
      log(`Failed to compile ${goFile}: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // Copy wasm_exec.js from Go installation to public folder
  if (config.wasm.copyGoRuntime) {
    try {
      const goRoot = execSync(`${config.wasm.goBinaryPath} env GOROOT`, { encoding: 'utf8' }).trim();
      const wasmExecSrc = path.join(goRoot, 'misc', 'wasm', 'wasm_exec.js');
      const wasmExecDest = path.join(outputDir, 'wasm_exec.js');
      
      fs.copyFileSync(wasmExecSrc, wasmExecDest);
      log('Copied wasm_exec.js runtime to public folder', 'success');
    } catch (error) {
      log(`Failed to copy wasm_exec.js: ${error.message}`, 'warning');
    }
  }
}

// Build client code with esbuild
async function buildClient() {
  const formats = config.dualModuleSupport ? config.outputFormats : ['esm'];
  
  for (const format of formats) {
    const outfile = path.join(
      __dirname, 
      'dist', 
      config.output.client[format].replace('[name]', 'client')
    );
    
    log(`Building client bundle (${format})...`);
    
    await esbuild.build({
      entryPoints: [path.join(__dirname, config.entryPoints.client)],
      bundle: true,
      outfile,
      format,
      platform: 'browser',
      target: config.options.target,
      minify: config.options.minify,
      sourcemap: config.options.sourcemap,
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        '__ESM__': format === 'esm' ? 'true' : 'false'
      },
      jsxFactory: 'jsx',
      jsxFragment: 'Fragment',
      banner: {
        js: format === 'esm' 
          ? `import { jsx, Fragment } from 'frontend-hamroun/jsx-runtime';` 
          : `const { jsx, Fragment } = require('frontend-hamroun/jsx-runtime');`
      }
    });
  }
  
  log('Client build completed', 'success');
}

// Build server code with esbuild
async function buildServer() {
  const formats = config.dualModuleSupport ? config.outputFormats : ['cjs'];
  
  for (const format of formats) {
    const outfile = path.join(
      __dirname, 
      'dist', 
      config.output.server[format].replace('[name]', 'server')
    );
    
    log(`Building server bundle (${format})...`);
    
    await esbuild.build({
      entryPoints: [path.join(__dirname, config.entryPoints.server)],
      bundle: true,
      outfile,
      format,
      platform: 'node',
      target: config.options.target,
      minify: config.options.minify,
      sourcemap: config.options.sourcemap,
      external: ['express', 'cors', 'path', 'fs', 'frontend-hamroun', 'frontend-hamroun/*'],
      define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        '__ESM__': format === 'esm' ? 'true' : 'false'
      }
    });
  }
  
  log('Server build completed', 'success');
}

// Utility to ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Execute the build
build();

// Support both CommonJS and ESM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { build };
}

export { build };
