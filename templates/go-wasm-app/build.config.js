// CommonJS/ESM compatible build configuration
const buildConfig = {
  /**
   * Determines if we should build for dual module support
   */
  dualModuleSupport: true,
  
  /**
   * Entry points for both client and server
   */
  entryPoints: {
    client: 'src/client.js',
    server: 'src/server.js'
  },
  
  /**
   * Output formats to generate
   */
  outputFormats: ['esm', 'cjs'],
  
  /**
   * Output directory configuration
   */
  output: {
    dir: 'dist',
    client: {
      esm: 'assets/[name].mjs',
      cjs: 'assets/[name].js'
    },
    server: {
      esm: 'server/[name].mjs',
      cjs: 'server/[name].js'
    }
  },
  
  /**
   * WebAssembly configuration
   */
  wasm: {
    enabled: true,
    goBinaryPath: 'go',
    sourceDir: 'src/wasm',
    outputDir: 'public/wasm',
    copyGoRuntime: true
  },
  
  /**
   * Additional build options
   */
  options: {
    minify: process.env.NODE_ENV === 'production',
    sourcemap: true,
    target: 'es2020'
  }
};

// Make it work in both ESM and CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = buildConfig;
}

export default buildConfig;
