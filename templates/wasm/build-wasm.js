import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const goDir = join(__dirname, 'go');
const outputDir = join(__dirname, 'public');
const wasmFile = join(outputDir, 'example.wasm');

// Prevent infinite loops by checking if we're already running
const lockFile = join(__dirname, '.build-lock');
if (fs.existsSync(lockFile)) {
  console.log('Build already in progress, skipping...');
  process.exit(0);
}

// Create lock file
fs.writeFileSync(lockFile, process.pid.toString());

// Clean up lock file on exit
process.on('exit', () => {
  try {
    fs.unlinkSync(lockFile);
  } catch (e) {
    // Ignore cleanup errors
  }
});

process.on('SIGINT', () => {
  try {
    fs.unlinkSync(lockFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  process.exit(0);
});

// Ensure public directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Only create Go files if they don't exist (prevent infinite generation)
if (!fs.existsSync(goDir) || !fs.existsSync(join(goDir, 'main.go'))) {
  console.log('Creating Go WASM example files...');
  fs.mkdirSync(goDir, { recursive: true });
  
  // Create the corrected Go main file with proper function names
  const goMainContent = `package main

import (
	"fmt"
	"strings"
	"syscall/js"
)

func goHello(this js.Value, inputs []js.Value) interface{} {
	name := inputs[0].String()
	return fmt.Sprintf("Hello, %s from Go WASM!", name)
}

func goAdd(this js.Value, inputs []js.Value) interface{} {
	a := inputs[0].Int()
	b := inputs[1].Int()
	return a + b
}

func goMultiply(this js.Value, inputs []js.Value) interface{} {
	a := inputs[0].Float()
	b := inputs[1].Float()
	return a * b
}

func goFibonacci(this js.Value, inputs []js.Value) interface{} {
	n := inputs[0].Int()
	if n <= 1 {
		return n
	}
	
	a, b := 0, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}

func goIsPrime(this js.Value, inputs []js.Value) interface{} {
	n := inputs[0].Int()
	if n < 2 {
		return false
	}
	if n == 2 {
		return true
	}
	if n%2 == 0 {
		return false
	}
	
	for i := 3; i*i <= n; i += 2 {
		if n%i == 0 {
			return false
		}
	}
	return true
}

func main() {
	fmt.Println("Go WASM initialized")
	
	// Register functions with correct names that match the frontend
	js.Global().Set("goHello", js.FuncOf(goHello))
	js.Global().Set("goAdd", js.FuncOf(goAdd))
	js.Global().Set("goMultiply", js.FuncOf(goMultiply))
	js.Global().Set("goFibonacci", js.FuncOf(goFibonacci))
	js.Global().Set("goIsPrime", js.FuncOf(goIsPrime))
	
	fmt.Println("Go functions registered and ready!")
	
	// Keep the program running
	select {}
}
`;
  
  fs.writeFileSync(join(goDir, 'main.go'), goMainContent);
  
  // Create go.mod file
  const goModContent = `module wasm-example

go 1.21
`;
  
  fs.writeFileSync(join(goDir, 'go.mod'), goModContent);
  
  console.log('✅ Go example files created');
} else {
  console.log('Go files already exist, skipping creation');
}

console.log('Building Go WASM module...');

// Set environment variables for WASM compilation
const env = {
  ...process.env,
  GOOS: 'js',
  GOARCH: 'wasm'
};

// Build command
const buildArgs = ['build', '-o', wasmFile, 'main.go'];

console.log(`Running: go ${buildArgs.join(' ')}`);
console.log(`Working directory: ${goDir}`);
console.log(`Output: ${wasmFile}`);

const goProcess = spawn('go', buildArgs, {
  cwd: goDir,
  env: env,
  stdio: 'inherit',
  shell: true
});

goProcess.on('close', (code) => {
  // Clean up lock file
  try {
    fs.unlinkSync(lockFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  if (code === 0) {
    console.log('✅ Go WASM build successful!');
    console.log(`📦 WASM file created: ${wasmFile}`);
    
    // Check if wasm_exec.js exists, if not, copy it
    const wasmExecJs = join(outputDir, 'wasm_exec.js');
    if (!fs.existsSync(wasmExecJs)) {
      console.log('📋 Copying wasm_exec.js...');
      
      // Try to find wasm_exec.js in GOROOT
      const findWasmExec = spawn('go', ['env', 'GOROOT'], {
        stdio: 'pipe',
        shell: true
      });
      
      let goroot = '';
      findWasmExec.stdout.on('data', (data) => {
        goroot += data.toString().trim();
      });
      
      findWasmExec.on('close', () => {
        if (goroot) {
          const wasmExecSource = join(goroot, 'misc', 'wasm', 'wasm_exec.js');
          if (fs.existsSync(wasmExecSource)) {
            fs.copyFileSync(wasmExecSource, wasmExecJs);
            console.log('✅ wasm_exec.js copied successfully');
          } else {
            console.log('⚠️  wasm_exec.js not found, you may need to copy it manually');
            console.log(`Expected location: ${wasmExecSource}`);
          }
        }
      });
    }
  } else {
    console.error('❌ Go WASM build failed with exit code:', code);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Make sure Go is installed and in your PATH');
    console.log('2. Check that your Go code in ./go/main.go is valid');
    console.log('3. Ensure you have Go 1.11+ for WASM support');
    process.exit(1);
  }
});

goProcess.on('error', (error) => {
  // Clean up lock file
  try {
    fs.unlinkSync(lockFile);
  } catch (e) {
    // Ignore cleanup errors
  }
  
  console.error('❌ Failed to start Go build process:', error.message);
  console.log('\n💡 Make sure Go is installed and available in your PATH');
  console.log('Download Go from: https://golang.org/dl/');
  process.exit(1);
});
