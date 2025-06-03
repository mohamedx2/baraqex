# WebAssembly (WASM) Integration Guide

Baraqex provides seamless integration with Go-compiled WebAssembly modules, allowing you to run high-performance Go code both on the server (Node.js) and in the browser.

## Table of Contents

- [Overview](#overview)
- [Server-side WASM Usage](#server-side-wasm-usage)
- [Client-side WASM Usage](#client-side-wasm-usage)
- [Creating Go WASM Modules](#creating-go-wasm-modules)
- [API Reference](#api-reference)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The WASM integration in Baraqex supports:
- Loading and executing Go WASM modules
- Automatic JavaScript-Go interop
- Memory management and error handling
- Both server-side (Node.js) and client-side (browser) execution
- Debug mode for development

## Server-side WASM Usage

### Basic Setup

```typescript
import { loadGoWasmFromFile, initNodeWasm } from 'baraqex/server';

// Initialize the Node.js WASM environment (optional, called automatically)
await initNodeWasm();

// Load a Go WASM module
const wasmInstance = await loadGoWasmFromFile('./path/to/your/module.wasm');

// Call exported Go functions
const result = wasmInstance.functions.myGoFunction('hello', 42);
console.log('Result from Go:', result);
```

### Advanced Configuration

```typescript
import { loadGoWasmFromFile } from 'baraqex/server';

const wasmInstance = await loadGoWasmFromFile('./module.wasm', {
  // Enable debug logging
  debug: true,
  
  // Provide custom import objects
  importObject: {
    env: {
      customFunction: (value: number) => {
        console.log('Called from Go with:', value);
        return value * 2;
      }
    }
  },
  
  // Callback when module is loaded
  onLoad: (instance) => {
    console.log('WASM module loaded successfully');
    console.log('Available functions:', Object.keys(instance.functions));
  }
});
```

### Using in Express Routes

```typescript
import { createServer } from 'baraqex/server';
import { loadGoWasmFromFile } from 'baraqex/server';

const server = createServer();
let wasmModule: any;

// Load WASM module during server startup
server.start().then(async () => {
  wasmModule = await loadGoWasmFromFile('./crypto.wasm');
});

// Use WASM in API routes
server.getExpressApp().post('/api/hash', (req, res) => {
  try {
    const { data } = req.body;
    const hash = wasmModule.functions.hashData(data);
    res.json({ hash });
  } catch (error) {
    res.status(500).json({ error: 'WASM execution failed' });
  }
});
```

## Client-side WASM Usage

### Basic Browser Usage

```typescript
import { loadGoWasm } from 'baraqex';

// Load WASM module in the browser
const wasmInstance = await loadGoWasm('./module.wasm');

// Call Go functions
const result = wasmInstance.functions.processData(inputData);
```

### React Component Example

```tsx
import React, { useEffect, useState } from 'react';
import { loadGoWasm } from 'baraqex';

export function WasmComponent() {
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    loadGoWasm('./math.wasm', { debug: true })
      .then(setWasmModule)
      .catch(console.error);
  }, []);

  const handleCalculate = () => {
    if (wasmModule) {
      const output = wasmModule.functions.fibonacci(10);
      setResult(`Fibonacci(10) = ${output}`);
    }
  };

  return (
    <div>
      <button onClick={handleCalculate} disabled={!wasmModule}>
        Calculate Fibonacci
      </button>
      <p>{result}</p>
    </div>
  );
}
```

## Creating Go WASM Modules

### Basic Go Module Structure

```go
// main.go
package main

import (
    "syscall/js"
    "strconv"
)

// Export a function to JavaScript
func fibonacci(this js.Value, args []js.Value) interface{} {
    n := args[0].Int()
    return fibonacciCalc(n)
}

func fibonacciCalc(n int) int {
    if n <= 1 {
        return n
    }
    return fibonacciCalc(n-1) + fibonacciCalc(n-2)
}

// Export a string processing function
func processString(this js.Value, args []js.Value) interface{} {
    input := args[0].String()
    return "Processed: " + input
}

func main() {
    // Keep the program running
    c := make(chan struct{}, 0)
    
    // Register functions
    js.Global().Set("fibonacci", js.FuncOf(fibonacci))
    js.Global().Set("processString", js.FuncOf(processString))
    
    println("Go WASM module initialized")
    <-c
}
```

### Compiling to WASM

```bash
# Set environment for WASM compilation
export GOOS=js
export GOARCH=wasm

# Compile to WASM
go build -o module.wasm main.go

# Copy the WASM support file (if needed for browser)
cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
```

### Advanced Go Example with Error Handling

```go
package main

import (
    "encoding/json"
    "syscall/js"
)

type ProcessRequest struct {
    Data   string `json:"data"`
    Method string `json:"method"`
}

type ProcessResponse struct {
    Result string `json:"result"`
    Error  string `json:"error,omitempty"`
}

func processJSON(this js.Value, args []js.Value) interface{} {
    defer func() {
        if r := recover(); r != nil {
            // Return error object
            errorResponse := ProcessResponse{
                Error: "Internal error occurred",
            }
            jsonBytes, _ := json.Marshal(errorResponse)
            return string(jsonBytes)
        }
    }()
    
    inputJSON := args[0].String()
    
    var request ProcessRequest
    if err := json.Unmarshal([]byte(inputJSON), &request); err != nil {
        response := ProcessResponse{
            Error: "Invalid JSON input",
        }
        jsonBytes, _ := json.Marshal(response)
        return string(jsonBytes)
    }
    
    // Process the data based on method
    var result string
    switch request.Method {
    case "uppercase":
        result = strings.ToUpper(request.Data)
    case "lowercase":
        result = strings.ToLower(request.Data)
    default:
        response := ProcessResponse{
            Error: "Unknown method: " + request.Method,
        }
        jsonBytes, _ := json.Marshal(response)
        return string(jsonBytes)
    }
    
    response := ProcessResponse{
        Result: result,
    }
    jsonBytes, _ := json.Marshal(response)
    return string(jsonBytes)
}

func main() {
    c := make(chan struct{}, 0)
    js.Global().Set("processJSON", js.FuncOf(processJSON))
    <-c
}
```

## API Reference

### Server-side Functions

#### `initNodeWasm(): Promise<void>`
Initializes the Node.js environment for WASM execution. Called automatically by `loadGoWasmFromFile`.

#### `loadGoWasmFromFile(path: string, options?: GoWasmOptions): Promise<GoWasmInstance>`
Loads a WASM module from a file path.

**Parameters:**
- `path`: File path to the WASM module
- `options`: Configuration options

**Options:**
```typescript
interface GoWasmOptions {
  debug?: boolean;                    // Enable debug logging
  importObject?: any;                 // Custom import objects
  onLoad?: (instance: GoWasmInstance) => void; // Load callback
}
```

**Returns:**
```typescript
interface GoWasmInstance {
  instance: WebAssembly.Instance;     // Raw WASM instance
  module: WebAssembly.Module;         // Compiled WASM module
  exports: any;                       // Direct exports
  functions: Record<string, Function>; // Wrapped Go functions
}
```

### Client-side Functions

#### `loadGoWasm(url: string, options?: GoWasmOptions): Promise<GoWasmInstance>`
Loads a WASM module from a URL in the browser.

### Error Handling

```typescript
try {
  const wasmInstance = await loadGoWasmFromFile('./module.wasm');
  const result = wasmInstance.functions.myFunction(data);
} catch (error) {
  if (error.message.includes('WASM')) {
    console.error('WASM-specific error:', error);
  } else {
    console.error('General error:', error);
  }
}
```

## Best Practices

### 1. Error Handling in Go
Always handle panics and return meaningful error messages:

```go
func safeFunction(this js.Value, args []js.Value) interface{} {
    defer func() {
        if r := recover(); r != nil {
            return map[string]interface{}{
                "error": "Function panicked",
                "details": fmt.Sprintf("%v", r),
            }
        }
    }()
    
    // Your function logic here
    return map[string]interface{}{
        "success": true,
        "result": "your result",
    }
}
```

### 2. Memory Management
Be mindful of memory usage in long-running WASM modules:

```go
// Release references when done
func cleanup() {
    // Clear large data structures
    largeSlice = nil
    // Force garbage collection if needed
    runtime.GC()
}
```

### 3. Async Operations
Use proper async patterns in JavaScript:

```typescript
// Good: Use async/await
const result = await wasmInstance.functions.asyncOperation(data);

// Or: Use Promises
wasmInstance.functions.asyncOperation(data)
  .then(result => {
    console.log('Success:', result);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### 4. Development vs Production
Use debug mode during development:

```typescript
const debugMode = process.env.NODE_ENV !== 'production';
const wasmInstance = await loadGoWasmFromFile('./module.wasm', {
  debug: debugMode
});
```

## Troubleshooting

### Common Issues

1. **Module not found**
   ```
   Error: ENOENT: no such file or directory
   ```
   - Ensure the WASM file path is correct
   - Check file permissions

2. **WASM compilation failed**
   ```
   Error: WebAssembly.compile failed
   ```
   - Verify the WASM file is valid
   - Check Go compilation errors

3. **Function not found**
   ```
   TypeError: wasmInstance.functions.myFunction is not a function
   ```
   - Ensure the function is exported in Go using `js.Global().Set()`
   - Check function name spelling

4. **Memory errors**
   ```
   Error: invalid array length
   ```
   - Check bounds in Go code
   - Ensure proper memory allocation

### Debug Tips

1. **Enable debug mode:**
   ```typescript
   const wasmInstance = await loadGoWasmFromFile('./module.wasm', {
     debug: true
   });
   ```

2. **Check available functions:**
   ```typescript
   console.log('Available functions:', Object.keys(wasmInstance.functions));
   ```

3. **Monitor memory usage:**
   ```typescript
   // Server-side
   console.log('Memory usage:', process.memoryUsage());
   
   // Browser
   console.log('Memory info:', performance.memory);
   ```

### Node.js Version Compatibility

- **Node.js >= 16**: Full support
- **Node.js 14-15**: May require `--experimental-wasm-bigint` flag
- **Node.js < 14**: Not supported

### Browser Compatibility

- **Chrome/Edge >= 69**: Full support
- **Firefox >= 63**: Full support  
- **Safari >= 14**: Full support
- **IE**: Not supported

## Examples

Check the `examples/` directory for complete working examples:

- `examples/wasm-server/` - Server-side WASM usage
- `examples/wasm-browser/` - Browser WASM integration
- `examples/go-modules/` - Sample Go WASM modules

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the test files in `tests/server/wasm.test.ts`
- Open an issue on the GitHub repository
