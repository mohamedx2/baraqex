@echo off
setlocal enabledelayedexpansion

echo 🚀 Building Go WASM module...

REM Check if Go is installed
where go >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Go is not installed or not in PATH
    pause
    exit /b 1
)

REM Display Go version
for /f "tokens=3" %%i in ('go version') do set GO_VERSION=%%i
echo 📋 Go version: %GO_VERSION%

REM Set WASM environment variables
set GOOS=js
set GOARCH=wasm

echo 🔧 Compiling main.go to example.wasm...

REM Compile Go to WASM
go build -o example.wasm main.go
if %ERRORLEVEL% NEQ 0 (
    echo ❌ WASM compilation failed!
    pause
    exit /b 1
)

echo ✅ WASM compilation successful!

REM Get file size
for %%A in (example.wasm) do set SIZE=%%~zA
echo 📦 WASM file size: %SIZE% bytes

REM Copy wasm_exec.js if it doesn't exist
if not exist "wasm_exec.js" (
    for /f "tokens=*" %%i in ('go env GOROOT') do set GOROOT=%%i
    if exist "!GOROOT!\misc\wasm\wasm_exec.js" (
        echo 📄 Copying wasm_exec.js...
        copy "!GOROOT!\misc\wasm\wasm_exec.js" . >nul
        echo ✅ wasm_exec.js copied
    ) else (
        echo ⚠️  Could not find wasm_exec.js in GOROOT
        echo GOROOT path: !GOROOT!
    )
)

echo.
echo 🎉 Build complete! Files created:
echo    • example.wasm (WASM binary)
if exist "wasm_exec.js" echo    • wasm_exec.js (Go WASM runtime)

echo.
echo Ready to test! Run: node test-enhanced.js
echo.
pause
