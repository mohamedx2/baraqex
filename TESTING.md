# Testing Infrastructure

Complete testing setup for the Baraqex project using Jest with TypeScript support, including unit tests, benchmarks, and coverage reporting.

## Test Suites

### Unit Tests (88 tests)
Located in `tests/` directory with the following test files:

- **tests/server/auth.test.ts** - Authentication and JWT token tests (10 tests)
- **tests/server/middleware.test.ts** - Express middleware tests (15 tests)
- **tests/server/utils.test.ts** - Server utility functions (55 tests)
- **tests/server/templates.test.ts** - Template rendering tests (2 tests)
- **tests/server/wasm.test.ts** - WebAssembly integration tests (4 tests)
- **tests/server/integration.test.ts** - Server integration tests (2 tests)

### Benchmark Tests (13 tests)
Located in `benchmarks/` directory for performance measurement:

- **benchmarks/server.benchmark.ts** - Server performance (6 tests)
  - Server creation time: ~0.03ms
  - Server startup time: ~163ms
  - Server shutdown time: ~0.2ms
  - Server restart time: ~2-6ms
  - Memory footprint: Tracks heap usage

- **benchmarks/middleware.benchmark.ts** - Middleware performance (7 tests)
  - Rate limiter: ~0.12ms per request
  - Request logger: ~0.65ms per request
  - Error handler: Variable (spy overhead)
  - 404 handler: ~0.03ms per request
  - Middleware stack: ~0.05ms total
  - Concurrent requests (100): ~5ms total (~0.05ms avg)

## Running Tests

### All Tests
```bash
npm test
```
Runs all unit tests and benchmarks (101 total tests)

### Unit Tests Only
```bash
npm run test
```
Runs the 88 unit tests in the `tests/` directory

### Watch Mode
```bash
npm run test:watch
```
Runs tests in watch mode for continuous development

### Benchmarks Only
```bash
npm run test:benchmarks
```
Runs the 13 performance benchmark tests

### Coverage Reports
```bash
npm run test:coverage
```
Generates coverage reports without opening browser

```bash
npm run test:coverage:report
```
Generates coverage reports and opens HTML report (Windows: skips open)

## Coverage Metrics

Current coverage baseline: **35%** (all thresholds)

Coverage by component:
- **src/server/middleware.ts** - 100% statements, 87.5% branches
- **src/server/utils.ts** - 100% statements, 96.29% branches
- **src/server/templates.ts** - 90.62% statements, 81.08% branches
- **src/server/auth.ts** - 80.76% statements, 70.58% branches
- **src/server/wasm.ts** - 58% statements, 43.33% branches
- **Frontend code** - 0% (not tested; client-side only)
- **API router** - 0% (requires API directory)

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **coverage/lcov-report/index.html** - HTML coverage report (open in browser)
- **coverage/lcov.info** - LCOV format (for CI/CD integration)
- **coverage/cobertura-coverage.xml** - Cobertura format
- **coverage/coverage-final.json** - JSON report

### Coverage Configuration

Coverage settings in `jest.config.js`:
- **Reporters**: text, text-summary, lcov, html, json, cobertura
- **Thresholds**: 35% baseline (statements, branches, functions, lines)
- **Collected From**: `src/**/*.ts` (excluding `.d.ts`, `index.ts`, `types.ts`)

## Configuration Files

### jest.config.js
- Preset: `ts-jest/presets/default-esm`
- Test Environment: Node.js
- Roots: `src/`, `tests/`, `benchmarks/`
- Test Pattern: `**/*.test.ts`, `**/*.spec.ts`, `**/*.benchmark.ts`

### tsconfig.json
TypeScript configuration with Jest types included:
```json
{
  "compilerOptions": {
    "types": ["node", "jest", "express"]
  }
}
```

### package.json Scripts
```json
{
  "test": "jest",
  "test:coverage": "jest --coverage",
  "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
  "test:watch": "jest --watch",
  "test:benchmarks": "jest benchmarks --verbose"
}
```

## Dependencies

Testing dependencies installed:
- **jest** - Test runner
- **ts-jest** - TypeScript support for Jest
- **@jest/globals** - Jest global types
- **@types/jest** - Jest type definitions
- **supertest** - HTTP assertion library
- **@types/supertest** - supertest types
- **@types/jsonwebtoken** - JWT type definitions

## Best Practices

### Writing Tests
1. Use descriptive test names that explain what is being tested
2. Group related tests in `describe` blocks
3. Use proper setup/teardown with `beforeEach`/`afterEach`
4. Mock external dependencies (file system, network, etc.)
5. Verify both success and error cases

### Benchmarking
1. Use `performance.now()` for timing measurements
2. Include warmup iterations if needed
3. Test with realistic data sizes
4. Set reasonable performance thresholds
5. Document baseline expectations

### Coverage
1. Aim for 80%+ statement coverage
2. Focus on branch coverage for complex logic
3. Exclude generated code and tests from coverage
4. Run coverage regularly in CI/CD pipeline
5. Review coverage reports for untested code paths

## Troubleshooting

### Tests Timeout
- Increase timeout: `it('test', () => {...}, 30000)`
- Check for hanging promises or unresolved mocks

### Module Not Found
- Check import paths use correct case
- Verify moduleNameMapper in jest.config.js
- Ensure all dependencies are installed

### Type Errors
- Run `npm run test` to see detailed errors
- Check tsconfig.json has correct type definitions
- Verify all `@types/` packages are installed

### Coverage Not Generated
- Ensure `collectCoverageFrom` pattern matches your files
- Check coverage thresholds aren't too high
- Verify tests are actually running code paths

## Integration with CI/CD

Example GitHub Actions workflow:
```yaml
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [ts-jest Setup Guide](https://kulshekhar.github.io/ts-jest/)
- [Testing Best Practices](https://jestjs.io/docs/getting-started)
- [Coverage Reports](https://istanbul.js.org/)
