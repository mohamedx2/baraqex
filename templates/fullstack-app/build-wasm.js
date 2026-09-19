import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const goDir = path.join(__dirname, 'go');
const outputDir = path.join(__dirname, 'public', 'wasm');
const wasmFile = path.join(outputDir, 'example.wasm');

function checkGo() {
  try {
    execSync('go version', { stdio: 'pipe' });
  } catch {
    console.error(
      '❌ Go is not installed or not on PATH.\n' +
      'Install Go from https://go.dev/dl/ then re-run `npm run build:wasm`.'
    );
    process.exit(1);
  }
}

function goRoot() {
  return execSync('go env GOROOT', { encoding: 'utf8' }).trim();
}

function buildWasm() {
  if (!existsSync(goDir)) {
    console.error(`❌ Go source directory not found: ${goDir}`);
    process.exit(1);
  }

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  console.log('🔥 Compiling Go WASM module...');
  const isWindows = process.platform === 'win32';
  const goMod = path.join(goDir, 'go.mod');
  if (!existsSync(goMod)) {
    execSync('go mod init wasm-example', { cwd: goDir, stdio: 'inherit' });
  }

  // Compile with the js/wasm target
  execSync(
    `go build -o "${wasmFile}" main.go`,
    {
      cwd: goDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        GOOS: 'js',
        GOARCH: 'wasm',
        CGO_ENABLED: '0'
      },
      shell: isWindows
    }
  );
  console.log(`✅ WASM compiled: ${wasmFile}`);
}

function copyRuntime() {
  const root = goRoot();
  const candidates = [
    path.join(root, 'lib', 'wasm', 'wasm_exec.js'),
    path.join(root, 'misc', 'wasm', 'wasm_exec.js')
  ];
  const wasmExec = candidates.find((p) => existsSync(p));
  const dest = path.join(outputDir, 'wasm_exec.js');

  if (!wasmExec) {
    console.warn(
      '⚠️  wasm_exec.js not found in this Go install. ' +
      'Copy it to public/wasm/wasm_exec.js manually:\n' +
      `  cp "${candidates.join('"  OR  "')}" ${dest}\n` +
      '(location varies by Go version: misc/wasm or lib/wasm)'
    );
    return;
  }

  copyFileSync(wasmExec, dest);
  console.log(`✅ Runtime copied: ${dest}`);
}

buildWasm();
copyRuntime();
console.log('🎉 Go WASM build complete. Serve /wasm/example.wasm + /wasm/wasm_exec.js.');
