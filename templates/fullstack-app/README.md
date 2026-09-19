# Baraqex Full-Stack Template

A complete starter that brings together the full Baraqex stack in one project:

- **Frontend** — JSX components with hooks in `src/`
- **Backend** — Express REST API in `server.ts` under `/api/*`
- **SSR** — the same `<App/>` is server-rendered with Baraqex and hydrated on the client
- **WebAssembly (Go)** — `go/main.go` compiles to WASM and runs in the browser
- **Live reload** — esbuild rebuild + Socket.IO reload in dev mode

## Prerequisites

- Node.js >= 18
- Go >= 1.21 (only needed for the WASM demo)

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Compile the Go WASM module (produces public/wasm/example.wasm + wasm_exec.js)
npm run build:wasm

# 3. Run in development (esbuild bundles src/, live reload over Socket.IO)
npm run dev
```

Open `http://localhost:3000`.

## Production build

```bash
npm run build:wasm   # compile Go -> WASM
npm run build        # bundle client + server to dist/
npm run start        # node dist/server.js
```

## What's where

| Path              | Purpose                                    |
| ----------------- | ------------------------------------------ |
| `src/App.tsx`     | Shared app component (SSR + client)        |
| `src/pages/*`     | Home, About, and WASM demo pages           |
| `src/main.tsx`    | Client entry — hydrates the SSR markup     |
| `server.ts`       | Express server: API, static, SSR           |
| `go/main.go`      | Go source compiled to WebAssembly          |
| `build-wasm.js`   | Compiles `go/` to `public/wasm/`           |
| `build.mjs`       | esbuild bundle for client + server         |

## The WASM demo

The **WASM (Go)** page loads `public/wasm/example.wasm` through Baraqex's `loadGoWasm`
and exposes these Go functions in the browser:

- `goAdd(a, b)`
- `goMultiply(a, b)`
- `goFibonacci(n)`
- `goProcessArray([...])`

If the page shows a load error, run `npm run build:wasm` and confirm
`/wasm/example.wasm` is served.
