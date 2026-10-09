# Changelog

All notable changes to Baraqex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.9] - 2026-10-09

### Fixed
- **Critical: infinite re-render loop on hydration / any re-render.** Component
  ids were assigned with a counter that was never reset between render passes,
  so hooks (`useState`, `useEffect`, …) never kept their state across
  re-renders. Any `useEffect` that called `setState` (e.g. the fullstack
  template's `HomePage` fetching users on load) triggered an endless
  `render → effect → setState → render` microtask loop that starved the event
  loop — pages only ever appeared to load (the SSR HTML stayed visible) but
  never became interactive, kept the browser spinner spinning, and links/buttons
  did nothing ("takes big time to load" / "loads and doesn't open").
  Render passes now start with `beginRenderPass()`, which resets the
  component-id counter so ids (and therefore hook state) are stable across
  re-renders. Verified in-browser: DOMContentLoaded ~95 ms, navigation, state
  persistence, and the Go WASM demo all work.
- Added regression tests (`tests/client/hooks.test.ts`) that fail without the fix.

## [2.0.8] - 2026-10-09

### Changed
- **Fullstack template performance:** server bundle minified in production,
  HTML + WASM compressed by default, aggressive asset cache headers
  (`/wasm/*` immutable, `/build/*` 1 h in prod, `no-store` in dev), `wasm_exec.js`
  injected only on the WASM route (deferred), CSS bundled through
  Tailwind/PostCSS with instant rebuilds, and the client no longer imports
  the stylesheet (styles served via the server).

## [2.0.0] - 2026-01-09

### 🚀 Major Release

This release marks a significant upgrade to production-ready quality with improved testing, documentation, and developer experience.

### Added
- **Comprehensive Test Suite** - 140+ tests covering all server modules
- **Performance Benchmarks** - Automated benchmarks for server and middleware
- **GitHub Actions CI/CD** - Automated testing, linting, and releases
- **Database Tests** - Full test coverage for MongoDB, PostgreSQL, MySQL adapters
- **API Router Tests** - Tests for file-based routing system
- **CONTRIBUTING.md** - Contribution guidelines for open source
- **CHANGELOG.md** - Version history tracking
- **CODE_OF_CONDUCT.md** - Community standards
- Professional README with badges, examples, and documentation

### Changed
- **Package.json** - Updated metadata for npm publishing
  - Added `engines` (Node >= 18)
  - Added `repository`, `bugs`, `homepage` URLs
  - Added `funding` configuration
  - Added `sideEffects: false` for tree-shaking
  - Expanded `keywords` for discoverability
- **Jest Configuration** - Per-file coverage thresholds
- **Coverage Thresholds** - Realistic targets based on module type

### Fixed
- TypeScript errors in benchmark files
- Mock implementations in test files
- ServerConfig type definitions
- Flaky benchmark timing thresholds

### Improved
- Code coverage from ~40% to 56.66%
- Function coverage to 62.12%
- Test suite from 88 to 140 tests

---

## [1.0.76] - Previous Release

### Features
- Core JSX rendering engine
- Server-side rendering (SSR)
- WebAssembly (Go WASM) integration
- Express-based server with middleware
- File-based API routing
- JWT authentication
- Password hashing with bcrypt
- Database adapters (MongoDB, PostgreSQL, MySQL)
- Rate limiting middleware
- Request logging
- Error handling
- CLI with project scaffolding
- Multiple project templates

---

## [1.0.0] - Initial Release

### Features
- Basic JSX support
- useState, useEffect hooks
- Server module
- WASM loader for browser
