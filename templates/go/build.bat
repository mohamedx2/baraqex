@echo off
echo Building Go WASM module...

REM Check if Go is installed
where go >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Go is not installed
    exit /b 1
)

REM Build WASM module
set GOOS=js
set GOARCH=wasm
go build -o example.wasm example.go
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to build Go WASM module
    exit /b 1
)

REM Copy wasm_exec.js files
for /f "tokens=*" %%g in ('go env GOROOT') do (set GOROOT=%%g)

echo Copying WASM runtime files from %GOROOT%\misc\wasm\
copy "%GOROOT%\misc\wasm\wasm_exec.js" .
copy "%GOROOT%\misc\wasm\wasm_exec_node.js" .

echo Build complete!
echo Files created:
echo - example.wasm - WebAssembly module
echo - wasm_exec.js - Browser runtime
echo - wasm_exec_node.js - Node.js runtime

echo.
echo Usage:
echo 1. Copy these files to your project's public directory
echo 2. Load the WASM module using the provided utilities
