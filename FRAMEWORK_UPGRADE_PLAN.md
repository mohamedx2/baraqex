# Baraqex Framework Upgrade Plan

Production-grade refactoring and architecture upgrade for the Baraqex full-stack framework.

---

## PROGRESS SUMMARY

**Last Updated**: Session completed

### Completed Tasks ✅
- [x] Framework architecture analysis
- [x] Coverage gap identification
- [x] Jest configuration update with per-file thresholds
- [x] GitHub Actions CI/CD pipeline (.github/workflows/ci.yml)
- [x] New npm scripts (test:unit, test:integration, test:ci)
- [x] Database module tests (tests/server/database.test.ts)
- [x] API Router tests (tests/server/api-router.test.ts)
- [x] Fixed benchmark TypeScript errors
- [x] Coverage documentation update (COVERAGE.md)

### Test Results
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Test Suites | 6 passing | 10 passing | +4 |
| Total Tests | 88 passing | 140 passing | +52 |
| Coverage (Statements) | ~40% | 56.66% | +16.66% |
| Coverage (Functions) | ~47% | 62.12% | +15% |

### Module Coverage Progress
| Module | Before | After | Status |
|--------|--------|-------|--------|
| server/utils | 100% | 100% | ✅ |
| server/middleware | 100% | 100% | ✅ |
| server/templates | 90% | 90.62% | ✅ |
| server/auth | 80% | 80.76% | ✅ |
| server/database | 0% | 31.34% | 🔄 +31% |
| server/api-router | 0% | 28.78% | 🔄 +28% |

---

## 1. CURRENT STATE ANALYSIS

### Code Coverage Breakdown
```
Component           | Coverage | Status
--------------------|----------|--------
src/server/utils    | 100%     | Excellent
src/server/middleware| 100%    | Excellent  
src/server/templates| 90%      | Good
src/server/auth     | 80%      | Good
src/server/wasm     | 58%      | Needs work
src/server/api-router| 0%      | Dead code
src/server/database | 0%       | Dead code
src/router/index    | N/A      | Empty file
src/forms/index     | N/A      | Empty file
src/store/index     | N/A      | Empty file
src/frontend/index  | N/A      | Empty file
src/browser         | 0%       | Untested
src/wasm (browser)  | 0%       | Untested
```

### Critical Issues Identified

1. **Empty Modules (Dead Weight)**
   - `src/router/index.ts` - Empty
   - `src/forms/index.ts` - Empty
   - `src/store/index.ts` - Empty
   - `src/frontend/index.ts` - Empty

2. **Duplicated Functionality**
   - `src/wasm.ts` (browser) duplicates logic from `src/server/wasm.ts`
   - `src/browser.ts` duplicates utilities from `src/index.ts`
   - Template utilities duplicated across files

3. **Mixed Responsibilities**
   - `src/index.ts` handles runtime detection, lazy loading, AND exports
   - `src/server/index.ts` handles server, routing, SSR, and template rendering

4. **Untestable Code Paths**
   - Browser-specific code cannot run in Jest (Node.js)
   - API router requires filesystem structure
   - Database module requires external dependencies

5. **Missing Abstractions**
   - No plugin system
   - No hook system
   - No formal adapter pattern
   - No compiler/bundler integration

---

## 2. TARGET ARCHITECTURE

### Proposed Directory Structure
```
src/
├── core/                    # Framework core (environment-agnostic)
│   ├── index.ts            # Core exports
│   ├── config.ts           # Configuration system
│   ├── plugin.ts           # Plugin system
│   ├── hooks.ts            # Hook system
│   ├── errors.ts           # Error types
│   └── types.ts            # Shared types
│
├── runtime/                 # Runtime adapters
│   ├── index.ts            # Runtime exports
│   ├── node.ts             # Node.js runtime
│   ├── browser.ts          # Browser runtime
│   ├── edge.ts             # Edge runtime (future)
│   └── detect.ts           # Runtime detection
│
├── server/                  # Server module
│   ├── index.ts            # Server exports
│   ├── server.ts           # Server class
│   ├── middleware/         # Middleware directory
│   │   ├── index.ts
│   │   ├── rate-limit.ts
│   │   ├── logger.ts
│   │   ├── error-handler.ts
│   │   └── not-found.ts
│   ├── auth/               # Auth module
│   │   ├── index.ts
│   │   ├── jwt.ts
│   │   ├── password.ts
│   │   └── middleware.ts
│   ├── database/           # Database adapters
│   │   ├── index.ts
│   │   ├── base.ts
│   │   ├── mongodb.ts
│   │   ├── postgres.ts
│   │   └── mysql.ts
│   └── utils/              # Server utilities
│       ├── index.ts
│       ├── response.ts
│       ├── validation.ts
│       └── pagination.ts
│
├── router/                  # Router module
│   ├── index.ts            # Router exports
│   ├── router.ts           # Core router
│   ├── file-router.ts      # File-based routing
│   ├── matcher.ts          # Route matching
│   └── types.ts            # Router types
│
├── renderer/                # SSR/Template rendering
│   ├── index.ts
│   ├── html.ts             # HTML generation
│   ├── component.ts        # Component rendering
│   └── templates.ts        # Template utilities
│
├── wasm/                    # WASM module
│   ├── index.ts            # WASM exports
│   ├── browser.ts          # Browser WASM loader
│   ├── node.ts             # Node.js WASM loader
│   └── types.ts            # WASM types
│
├── compiler/                # Build tooling (future)
│   ├── index.ts
│   ├── bundler.ts
│   └── transforms.ts
│
├── cli/                     # CLI internals
│   ├── index.ts
│   ├── commands/
│   │   ├── create.ts
│   │   ├── dev.ts
│   │   ├── build.ts
│   │   └── test.ts
│   └── utils.ts
│
└── adapters/                # Framework adapters
    ├── express.ts
    ├── fastify.ts          # Future
    └── hono.ts             # Future
```

### Module Dependency Graph
```
                    ┌─────────┐
                    │  core   │
                    └────┬────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐    ┌─────────┐    ┌─────────┐
    │ runtime │    │  router │    │renderer │
    └────┬────┘    └────┬────┘    └────┬────┘
         │              │              │
         └──────────────┼──────────────┘
                        │
                        ▼
                  ┌─────────┐
                  │  server │
                  └────┬────┘
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐    ┌────────┐    ┌────────┐
    │  wasm  │    │   cli  │    │adapters│
    └────────┘    └────────┘    └────────┘
```

---

## 3. DEAD CODE REMOVAL STRATEGY

### Phase 1: Remove Empty Modules
```bash
# Files to delete immediately
src/router/index.ts          # Empty - replace with proper router
src/router/types.ts          # Empty or unused
src/forms/index.ts           # Empty - remove or implement
src/forms/types.ts           # Empty or unused
src/store/index.ts           # Empty - remove or implement
src/store/types.ts           # Empty or unused
src/frontend/index.ts        # Empty - remove or implement
```

### Phase 2: Consolidate Duplicates
```typescript
// BEFORE: Duplicated in src/index.ts and src/browser.ts
export const safeJsonParse = (json: string, fallback: any) => { ... };
export const generateToken = (length: number = 32) => { ... };

// AFTER: Single source in src/core/utils.ts
// src/core/utils.ts
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function generateToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}
```

### Phase 3: Refactor Mixed Responsibilities
```typescript
// BEFORE: src/index.ts does everything
// - Runtime detection
// - Lazy imports
// - Export aggregation
// - Fallback implementations

// AFTER: Split into focused modules
// src/runtime/detect.ts
export const runtime = {
  isNode: typeof process !== 'undefined' && !!process.versions?.node,
  isBrowser: typeof window !== 'undefined',
  isEdge: typeof EdgeRuntime !== 'undefined',
  isDeno: typeof Deno !== 'undefined'
} as const;

// src/runtime/node.ts
export async function loadServerModules() {
  const [server, utils, templates] = await Promise.all([
    import('../server/index.js'),
    import('../server/utils/index.js'),
    import('../renderer/templates.js')
  ]);
  return { server, utils, templates };
}

// src/runtime/browser.ts
export { loadGoWasm, callWasmFunction } from '../wasm/browser.js';
export { safeJsonParse, generateToken } from '../core/utils.js';
```

---

## 4. TESTING STRATEGY

### Testing Pyramid
```
                    ▲
                   ╱ ╲
                  ╱ E2E ╲           5% - Full app tests
                 ╱───────╲
                ╱Integration╲       20% - Module integration
               ╱─────────────╲
              ╱    Unit Tests  ╲    75% - Pure logic
             ╱─────────────────╲
            ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
```

### Test Organization
```
tests/
├── unit/                    # Pure logic tests
│   ├── core/
│   │   ├── config.test.ts
│   │   ├── plugin.test.ts
│   │   └── hooks.test.ts
│   ├── server/
│   │   ├── auth.test.ts
│   │   ├── middleware.test.ts
│   │   └── utils.test.ts
│   ├── router/
│   │   ├── matcher.test.ts
│   │   └── router.test.ts
│   └── renderer/
│       └── templates.test.ts
│
├── integration/             # Module integration
│   ├── server/
│   │   ├── server-lifecycle.test.ts
│   │   ├── middleware-chain.test.ts
│   │   └── api-routing.test.ts
│   ├── router/
│   │   └── file-router.test.ts
│   └── wasm/
│       └── wasm-loading.test.ts
│
├── e2e/                     # End-to-end tests
│   ├── app/                 # Minimal test app
│   │   ├── api/
│   │   ├── pages/
│   │   └── server.ts
│   ├── server.e2e.test.ts
│   └── cli.e2e.test.ts
│
├── browser/                 # Browser-specific tests (Playwright)
│   ├── wasm.browser.test.ts
│   └── hydration.browser.test.ts
│
└── benchmarks/              # Performance tests
    ├── server.benchmark.ts
    ├── router.benchmark.ts
    └── middleware.benchmark.ts
```

### Coverage Targets by Module
```
Module          | Target | Current | Priority
----------------|--------|---------|----------
core/           | 95%    | N/A     | P0
server/utils    | 95%    | 100%    | Done
server/auth     | 90%    | 80%     | P1
server/middleware| 95%   | 100%    | Done
router/         | 90%    | 0%      | P0
renderer/       | 85%    | 90%     | Good
wasm/node       | 80%    | 58%     | P1
wasm/browser    | 70%    | 0%      | P2 (needs Playwright)
cli/            | 75%    | 0%      | P2
```

### Jest Configuration for Separate Environments
```javascript
// jest.config.js
export default {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'node',
      coverageThreshold: {
        global: { branches: 80, functions: 85, lines: 85, statements: 85 }
      }
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
      coverageThreshold: {
        global: { branches: 70, functions: 75, lines: 75, statements: 75 }
      }
    },
    {
      displayName: 'benchmarks',
      testMatch: ['<rootDir>/tests/benchmarks/**/*.benchmark.ts'],
      testEnvironment: 'node'
    }
  ]
};
```

---

## 5. PLUGIN SYSTEM DESIGN

### Plugin Interface
```typescript
// src/core/plugin.ts
export interface BaraqexPlugin {
  name: string;
  version?: string;
  
  // Lifecycle hooks
  onServerCreate?(server: Server): void | Promise<void>;
  onServerStart?(server: Server): void | Promise<void>;
  onServerStop?(server: Server): void | Promise<void>;
  
  // Request hooks
  onRequest?(req: Request, res: Response): void | Promise<void>;
  onResponse?(req: Request, res: Response): void | Promise<void>;
  onError?(error: Error, req: Request, res: Response): void | Promise<void>;
  
  // Router hooks
  onRouteMatch?(route: Route, params: Params): void | Promise<void>;
  
  // Renderer hooks
  onRender?(component: Component, context: RenderContext): void | Promise<void>;
}

export class PluginManager {
  private plugins: Map<string, BaraqexPlugin> = new Map();
  
  register(plugin: BaraqexPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" already registered`);
    }
    this.plugins.set(plugin.name, plugin);
  }
  
  async runHook<K extends keyof BaraqexPlugin>(
    hookName: K,
    ...args: Parameters<NonNullable<BaraqexPlugin[K]>>
  ): Promise<void> {
    for (const plugin of this.plugins.values()) {
      const hook = plugin[hookName];
      if (typeof hook === 'function') {
        await (hook as Function).apply(plugin, args);
      }
    }
  }
}
```

### Example Plugin
```typescript
// plugins/request-timing.ts
import { BaraqexPlugin } from 'baraqex/core';

export const requestTimingPlugin: BaraqexPlugin = {
  name: 'request-timing',
  version: '1.0.0',
  
  onRequest(req, res) {
    req.startTime = performance.now();
  },
  
  onResponse(req, res) {
    const duration = performance.now() - req.startTime;
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  }
};
```

---

## 6. CONFIGURATION SYSTEM

### Type-Safe Config
```typescript
// src/core/config.ts
import { z } from 'zod';

export const ServerConfigSchema = z.object({
  port: z.number().min(1).max(65535).default(3000),
  host: z.string().default('localhost'),
  isDev: z.boolean().default(process.env.NODE_ENV !== 'production'),
  
  cors: z.object({
    enabled: z.boolean().default(false),
    origin: z.union([z.string(), z.array(z.string())]).optional(),
    credentials: z.boolean().default(false)
  }).optional(),
  
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    windowMs: z.number().default(60000),
    max: z.number().default(100)
  }).optional(),
  
  auth: z.object({
    jwtSecret: z.string().min(32),
    tokenExpiry: z.string().default('24h'),
    refreshTokenExpiry: z.string().default('7d')
  }).optional(),
  
  database: z.object({
    type: z.enum(['mongodb', 'postgres', 'mysql']),
    url: z.string().url()
  }).optional(),
  
  wasm: z.object({
    enabled: z.boolean().default(false),
    execPath: z.string().optional()
  }).optional()
});

export type ServerConfig = z.infer<typeof ServerConfigSchema>;

export function defineConfig(config: Partial<ServerConfig>): ServerConfig {
  return ServerConfigSchema.parse(config);
}
```

### Config File Support
```typescript
// baraqex.config.ts
import { defineConfig } from 'baraqex';

export default defineConfig({
  port: 3000,
  cors: { enabled: true, origin: '*' },
  rateLimit: { windowMs: 60000, max: 100 },
  auth: { jwtSecret: process.env.JWT_SECRET! }
});
```

---

## 7. CI/CD PIPELINE

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unit
          fail_ci_if_error: true

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration -- --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: integration

  benchmarks:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test:benchmarks
      - name: Store benchmark result
        uses: benchmark-action/github-action-benchmark@v1
        with:
          tool: 'customSmallerIsBetter'
          output-file-path: benchmark-results.json
          github-token: ${{ secrets.GITHUB_TOKEN }}
          auto-push: true

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  release:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, unit-tests, integration-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 8. PERFORMANCE OPTIMIZATIONS

### Cold Start Optimization
```typescript
// BEFORE: Eager loading of all modules
import express from 'express';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';

// AFTER: Lazy loading with caching
const moduleCache = new Map<string, any>();

async function loadModule<T>(name: string, loader: () => Promise<T>): Promise<T> {
  if (!moduleCache.has(name)) {
    moduleCache.set(name, await loader());
  }
  return moduleCache.get(name) as T;
}

// Only load when needed
const express = await loadModule('express', () => import('express'));
```

### Hot Path Optimization
```typescript
// BEFORE: Creating objects on every request
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.url}`);
  next();
});

// AFTER: Minimal allocations
const logFormat = Buffer.from(' - ');
app.use((req, res, next) => {
  process.stdout.write(Date.now().toString());
  process.stdout.write(logFormat);
  process.stdout.write(req.method);
  process.stdout.write(' ');
  process.stdout.write(req.url);
  process.stdout.write('\n');
  next();
});
```

### Tree-Shaking Entry Points
```typescript
// package.json exports map for tree-shaking
{
  "exports": {
    ".": {
      "browser": "./dist/browser.js",
      "node": "./dist/node.js",
      "types": "./dist/index.d.ts"
    },
    "./server": {
      "node": "./dist/server/index.js",
      "types": "./dist/server/index.d.ts"
    },
    "./router": {
      "import": "./dist/router/index.js",
      "types": "./dist/router/index.d.ts"
    },
    "./wasm": {
      "browser": "./dist/wasm/browser.js",
      "node": "./dist/wasm/node.js",
      "types": "./dist/wasm/index.d.ts"
    }
  },
  "sideEffects": false
}
```

---

## 9. SECURITY HARDENING

### Input Validation
```typescript
// src/server/middleware/validate.ts
import { z, ZodSchema } from 'zod';

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten()
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: result.error.flatten()
      });
    }
    req.query = result.data as any;
    next();
  };
}
```

### Safe Defaults
```typescript
// src/core/defaults.ts
export const SECURITY_DEFAULTS = {
  // Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 60_000,    // 1 minute
    max: 100,            // 100 requests per window
    skipSuccessfulRequests: false
  },
  
  // CORS (restrictive by default)
  cors: {
    origin: false,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // JWT
  jwt: {
    algorithm: 'HS256' as const,
    expiresIn: '24h',
    issuer: 'baraqex'
  }
} as const;
```

### Plugin Sandboxing
```typescript
// src/core/plugin-sandbox.ts
export function createPluginSandbox(plugin: BaraqexPlugin) {
  const forbiddenGlobals = ['process', 'require', '__dirname', '__filename'];
  
  return new Proxy(plugin, {
    get(target, prop) {
      if (forbiddenGlobals.includes(String(prop))) {
        throw new Error(`Plugin "${target.name}" attempted to access forbidden global: ${String(prop)}`);
      }
      return Reflect.get(target, prop);
    }
  });
}
```

---

## 10. CLI IMPROVEMENTS

### Enhanced Commands
```typescript
// bin/baraqex.ts
import { Command } from 'commander';

const program = new Command();

program
  .name('baraqex')
  .version('2.0.0')
  .description('Baraqex Framework CLI');

// Create command with templates
program
  .command('create <name>')
  .description('Create a new Baraqex project')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('--typescript', 'Use TypeScript', true)
  .option('--git', 'Initialize git repository', true)
  .option('--install', 'Install dependencies', true)
  .action(async (name, options) => {
    await createProject(name, options);
  });

// Dev server with HMR
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('--open', 'Open in browser', false)
  .action(async (options) => {
    await startDevServer(options);
  });

// Production build
program
  .command('build')
  .description('Build for production')
  .option('--analyze', 'Analyze bundle size', false)
  .option('--minify', 'Minify output', true)
  .option('--sourcemap', 'Generate sourcemaps', false)
  .action(async (options) => {
    await buildProject(options);
  });

// Test runner
program
  .command('test')
  .description('Run tests')
  .option('--coverage', 'Generate coverage report', false)
  .option('--watch', 'Watch mode', false)
  .option('--unit', 'Run unit tests only', false)
  .option('--integration', 'Run integration tests only', false)
  .action(async (options) => {
    await runTests(options);
  });

// Benchmarks
program
  .command('benchmark')
  .description('Run performance benchmarks')
  .option('--compare <ref>', 'Compare with git ref')
  .action(async (options) => {
    await runBenchmarks(options);
  });

program.parse();
```

### Better Error Messages
```typescript
// src/cli/errors.ts
export class BaraqexError extends Error {
  constructor(
    message: string,
    public code: string,
    public suggestion?: string
  ) {
    super(message);
    this.name = 'BaraqexError';
  }
  
  format(): string {
    let output = `\n${chalk.red('Error:')} ${this.message}\n`;
    output += `${chalk.dim('Code:')} ${this.code}\n`;
    if (this.suggestion) {
      output += `\n${chalk.yellow('Suggestion:')} ${this.suggestion}\n`;
    }
    return output;
  }
}

// Usage
throw new BaraqexError(
  'Express is not installed',
  'MISSING_DEPENDENCY',
  'Run: npm install express'
);
```

---

## 11. ROADMAP

### Short-Term (1-2 weeks)
- [ ] Remove empty modules (router, forms, store, frontend)
- [ ] Consolidate duplicated utilities
- [ ] Split src/index.ts into focused modules
- [ ] Add tests for api-router.ts (currently 0%)
- [ ] Add tests for database.ts (currently 0%)
- [ ] Increase WASM coverage to 80%
- [ ] Set up proper test projects for file-based routing

### Medium-Term (1-2 months)
- [ ] Implement plugin system
- [ ] Implement hook system
- [ ] Add Zod-based config validation
- [ ] Refactor CLI commands
- [ ] Add Playwright for browser tests
- [ ] Set up proper CI/CD pipeline
- [ ] Add benchmark tracking over time

### Long-Term (3-6 months)
- [ ] Add Fastify adapter
- [ ] Add Hono adapter for edge
- [ ] Compiler/bundler integration
- [ ] Hot module replacement (HMR)
- [ ] Visual config editor
- [ ] Plugin marketplace
- [ ] Documentation site

---

## 12. REFACTORING EXECUTION PLAN

### Step 1: Create Core Module (Day 1-2)
```bash
mkdir -p src/core
# Create: config.ts, plugin.ts, hooks.ts, errors.ts, types.ts, utils.ts
```

### Step 2: Create Runtime Module (Day 2-3)
```bash
mkdir -p src/runtime
# Create: detect.ts, node.ts, browser.ts
# Move runtime detection logic from src/index.ts
```

### Step 3: Refactor Server Module (Day 3-5)
```bash
mkdir -p src/server/middleware src/server/auth src/server/database src/server/utils
# Split current monolithic files into focused modules
```

### Step 4: Implement Router Module (Day 5-7)
```bash
mkdir -p src/router
# Create: router.ts, file-router.ts, matcher.ts, types.ts
# Move logic from api-router.ts, add proper abstraction
```

### Step 5: Create Renderer Module (Day 7-8)
```bash
mkdir -p src/renderer
# Create: html.ts, component.ts, templates.ts
# Consolidate from server-renderer.ts and templates.ts
```

### Step 6: Refactor WASM Module (Day 8-9)
```bash
mkdir -p src/wasm
# Create: browser.ts, node.ts, types.ts
# Consolidate from src/wasm.ts and src/server/wasm.ts
```

### Step 7: Add Tests (Day 9-14)
```bash
# Add integration tests for:
# - File-based routing with mock filesystem
# - Database adapters with test containers
# - WASM loading with mock modules
# - Full server lifecycle
```

### Step 8: CI/CD Setup (Day 14-15)
```bash
# Create .github/workflows/ci.yml
# Set up Codecov integration
# Add benchmark tracking
```

---

## CONCLUSION

This upgrade plan transforms Baraqex from a prototype-level framework into a production-ready system with:

1. **Clear Architecture**: Modular design with explicit dependencies
2. **High Coverage**: 80%+ on core modules
3. **Testable Design**: Separate test strategies for unit/integration/e2e
4. **Plugin System**: Extensible without modifying core
5. **Type Safety**: Zod validation for configs
6. **Performance**: Lazy loading, tree-shaking, benchmarks
7. **Security**: Input validation, safe defaults, sandboxing
8. **DX**: Better CLI, error messages, config

Estimated effort: 2-3 weeks for core refactoring, 1-2 months for full implementation.
