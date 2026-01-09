# Changelog

All notable changes to Baraqex will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
