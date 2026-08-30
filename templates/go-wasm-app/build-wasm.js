import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';
import os from 'os';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if running on Windows
const isWindows = os.platform() === 'win32';

// Check if Go is installed
function checkGoInstallation() {
  try {
    const output = execSync('go version', { encoding: 'utf8' });
    console.log(`✓ Found Go: ${output.trim()}`);
    return true;
  } catch (error) {
    console.error('✗ Go is not installed or not in PATH');
    console.error('Please install Go from https://golang.org/dl/');
    return false;
  }
}

// Ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Build Go WASM modules
async function buildWasmModules() {
  // Check if Go is installed
  if (!checkGoInstallation()) {
    process.exit(1);
  }

  // Directory containing Go source files
  const goSourceDir = resolve(__dirname, 'src', 'wasm');
  
  // Output directory for WASM files
  const wasmOutputDir = resolve(__dirname, 'public', 'wasm');
  
  // Create directories if they don't exist
  ensureDir(goSourceDir);
  ensureDir(wasmOutputDir);
  
  // Get the Go root directory
  const goRoot = execSync('go env GOROOT', { encoding: 'utf8' }).trim();
  
  // Copy the wasm_exec.js files to the output directory (for both browser and Node.js)
  const wasmExecJsPath = join(goRoot, 'misc', 'wasm', 'wasm_exec.js');
  const wasmExecJsDest = join(wasmOutputDir, 'wasm_exec.js');
  
  const wasmExecNodeJsPath = join(goRoot, 'misc', 'wasm', 'wasm_exec_node.js');
  const wasmExecNodeJsDest = join(wasmOutputDir, 'wasm_exec_node.js');
  
  console.log(`Copying ${wasmExecJsPath} to ${wasmExecJsDest}`);
  fs.copyFileSync(wasmExecJsPath, wasmExecJsDest);
  
  console.log(`Copying ${wasmExecNodeJsPath} to ${wasmExecNodeJsDest}`);
  fs.copyFileSync(wasmExecNodeJsPath, wasmExecNodeJsDest);
  
  // Build all Go files in the WASM directory
  const goFiles = fs.readdirSync(goSourceDir).filter(file => file.endsWith('.go'));
  
  if (goFiles.length === 0) {
    console.log('No Go files found in src/wasm');
    
    // Create an example Go file
    const exampleGoFile = join(goSourceDir, 'example.go');
    const exampleGoContent = `//go:build js && wasm
// +build js,wasm

package main

import (
	"encoding/json"
	"fmt"
	"syscall/js"
)

// Example Go function to be called from JavaScript
func add(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return js.ValueOf("Error: Expected two arguments")
	}
	
	a := args[0].Int()
	b := args[1].Int()
	return js.ValueOf(a + b)
}

// Process complex data in Go
func processData(this js.Value, args []js.Value) interface{} {
	if len(args) == 0 {
		return js.ValueOf("Error: Expected at least one argument")
	}

	// Get input data
	data := args[0]
	if data.Type() != js.TypeObject {
		return js.ValueOf("Error: Expected JSON object")
	}

	// Convert JS object to Go map
	jsonStr := js.Global().Get("JSON").Call("stringify", data).String()
	var inputMap map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &inputMap); err != nil {
		return js.ValueOf(fmt.Sprintf("Error parsing JSON: %s", err.Error()))
	}

	// Add new fields
	inputMap["processed"] = true
	inputMap["processor"] = "Go WASM"

	// Add some computed fields
	if values, ok := inputMap["values"].([]interface{}); ok {
		sum := 0.0
		for _, v := range values {
			if num, ok := v.(float64); ok {
				sum += num
			}
		}
		inputMap["sum"] = sum
	}

	// Convert back to JS
	resultJSON, err := json.Marshal(inputMap)
	if err != nil {
		return js.ValueOf(fmt.Sprintf("Error generating JSON: %s", err.Error()))
	}

	return js.ValueOf(string(resultJSON))
}

func main() {
	fmt.Println("Go WASM Module initialized")
	
	// Register functions to be callable from JavaScript
	js.Global().Set("goAdd", js.FuncOf(add))
	js.Global().Set("goProcessData", js.FuncOf(processData))
	
	// Keep the program running
	<-make(chan bool)
}
`;
    
    fs.writeFileSync(exampleGoFile, exampleGoContent);
    console.log(`Created example Go file at ${exampleGoFile}`);
    
    // Add the new file to the list
    goFiles.push('example.go');
  }
  
  // Build each Go file
  for (const goFile of goFiles) {
    const goFilePath = join(goSourceDir, goFile);
    const wasmFileName = goFile.replace('.go', '.wasm');
    const wasmFilePath = join(wasmOutputDir, wasmFileName);
    
    console.log(`Building ${goFile} to ${wasmFilePath}`);
    
    try {
      // Create a unique temporary directory with timestamp
      const timestamp = Date.now();
      const tempDir = join(os.tmpdir(), `go-wasm-build-${timestamp}`);
      
      // Ensure the directory is clean (doesn't exist from previous builds)
      if (fs.existsSync(tempDir)) {
        if (isWindows) {
          // On Windows, we need to handle directory removal differently
          execSync(`rmdir /s /q "${tempDir}"`, { shell: true });
        } else {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      }
      
      // Create the temporary directory
      ensureDir(tempDir);
      
      // Copy the Go file to the temp directory
      const tempGoFile = join(tempDir, goFile);
      fs.copyFileSync(goFilePath, tempGoFile);
      
      // Initialize Go module
      console.log(`Initializing Go module in ${tempDir}`);
      execSync(`go mod init wasmapp`, { cwd: tempDir });
      
      // Build the WASM module with OS-specific command
      if (isWindows) {
        // Fix: Use Windows-specific environment variable setting
        execSync(`go build -o "${wasmFilePath}" "${tempGoFile}"`, {
          cwd: tempDir,
          env: {
            ...process.env,
            GOOS: 'js',
            GOARCH: 'wasm'
          }
        });
      } else {
        // Unix/Linux/Mac command
        execSync(`GOOS=js GOARCH=wasm go build -o "${wasmFilePath}" "${tempGoFile}"`, {
          cwd: tempDir
        });
      }
      
      // Clean up temporary directory
      try {
        if (isWindows) {
          execSync(`rmdir /s /q "${tempDir}"`, { shell: true });
        } else {
          fs.rmSync(tempDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.warn(`Warning: Failed to clean up temp directory ${tempDir}:`, cleanupError);
      }
      
      console.log(`✓ Successfully built ${wasmFileName}`);
    } catch (error) {
      console.error(`✗ Error building ${goFile}:`);
      console.error(error.message);
      if (error.stdout) console.error(error.stdout.toString());
      if (error.stderr) console.error(error.stderr.toString());
    }
  }
}

// Run the build process
buildWasmModules().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
});
