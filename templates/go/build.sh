#!/bin/bash

# Build script for Go WASM modules

# Ensure Go is installed
if ! command -v go &> /dev/null; then
    echo "Error: Go is not installed"
    exit 1
fi

# Check Go version
GO_VERSION=$(go version | cut -d ' ' -f 3 | sed 's/go//')
GO_VERSION_MAJOR=$(echo $GO_VERSION | cut -d '.' -f 1)
GO_VERSION_MINOR=$(echo $GO_VERSION | cut -d '.' -f 2)

if [ $GO_VERSION_MAJOR -lt 1 ] || ([ $GO_VERSION_MAJOR -eq 1 ] && [ $GO_VERSION_MINOR -lt 16 ]); then
    echo "Warning: Go version 1.16+ recommended for WebAssembly, detected $GO_VERSION"
fi

# Build example WASM module
echo "Building example Go WASM module..."
GOOS=js GOARCH=wasm go build -o example.wasm example.go
if [ $? -ne 0 ]; then
    echo "Error: Failed to build Go WASM module"
    exit 1
fi

# Copy wasm_exec.js files for browser and Node.js from Go installation
GO_ROOT=$(go env GOROOT)
echo "Copying wasm_exec.js files from $GO_ROOT/misc/wasm/"
cp "$GO_ROOT/misc/wasm/wasm_exec.js" ./
cp "$GO_ROOT/misc/wasm/wasm_exec_node.js" ./

echo "Build complete!"
echo "Files created:"
echo "- example.wasm - WebAssembly module"
echo "- wasm_exec.js - Browser runtime"
echo "- wasm_exec_node.js - Node.js runtime"

echo ""
echo "Usage:"
echo "1. Copy these files to your project's public directory"
echo "2. Load the WASM module using the provided utilities"
