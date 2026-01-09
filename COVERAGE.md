# Test Coverage Guide

This guide explains how to run tests with coverage analysis and interpret the coverage reports.

## Overview

The Baraqex project uses Jest for testing and coverage reporting. We maintain coverage metrics across:
- **Lines**: Code statements executed
- **Branches**: Conditional paths taken
- **Functions**: Function invocations
- **Statements**: Individual statements

## Running Tests with Coverage

### Generate Coverage Report
```bash
npm run test:coverage
```

This command:
- Runs all tests with coverage collection
- Generates coverage reports in multiple formats
- Displays coverage summary in the terminal
- Creates an HTML report at `coverage/lcov-report/index.html`

### View Coverage in Browser
```bash
npm run test:coverage:report
```

Opens the detailed HTML coverage report in your default browser.

### Watch Mode with Coverage
```bash
npm run test:watch
```

Runs tests in watch mode for development.

## Coverage Thresholds

The project enforces minimum coverage thresholds:

| Metric | Threshold |
|--------|-----------|
| Branches | 50% |
| Functions | 60% |
| Lines | 60% |
| Statements | 60% |

Tests fail if coverage falls below these thresholds.

## Reading Coverage Reports

### Terminal Output
```
┌─────────────────────────────────────┬──────┬───────┬──────┬────────┐
│ File                                │ Line │ Branch│ Func │ Overall│
├─────────────────────────────────────┼──────┼───────┼──────┼────────┤
│ src/server/index.ts                 │ 85%  │ 72%   │ 90%  │  82%   │
│ src/server/middleware.ts            │ 92%  │ 88%   │ 95%  │  92%   │
└─────────────────────────────────────┴──────┴───────┴──────┴────────┘
```

Color coding:
- 🟢 **Green (90%+)**: Excellent coverage
- 🟡 **Yellow (70-89%)**: Good coverage
- 🔴 **Red (<70%)**: Needs improvement

### HTML Report
The HTML report (`coverage/lcov-report/index.html`) provides:

1. **Summary Page**: Overall coverage metrics
2. **File List**: Coverage by file
3. **Source View**: Line-by-line coverage indicator
   - 🟢 Lines executed
   - 🔴 Lines NOT executed
   - Yellow: Conditional branches

## Improving Coverage

### 1. Identify Uncovered Code
```bash
npm run test:coverage
```

Look for files with low coverage percentages in the report.

### 2. Write Tests for Uncovered Lines
For each uncovered line, write a test that executes that code path:

```typescript
// ❌ Uncovered code
if (error.code === 'ENOENT') {
  console.log('File not found');
}

// ✅ Add test
it('should handle file not found error', () => {
  const error = new Error('Not found');
  (error as any).code = 'ENOENT';
  // Test the handler
});
```

### 3. Cover Edge Cases
- Null/undefined values
- Error conditions
- Boundary values
- Different data types

### 4. Test Conditional Branches
Ensure both `if` and `else` paths are tested:

```typescript
// Test both branches
it('should return true for valid input', () => {
  expect(validate('valid')).toBe(true);
});

it('should return false for invalid input', () => {
  expect(validate('invalid')).toBe(false);
});
```

## Coverage by Module

### Server (src/server/)
- `index.ts`: Core server functionality
- `middleware.ts`: Request middleware
- `auth.ts`: Authentication services
- `database.ts`: Database operations
- `utils.ts`: Utility functions

### Frontend (src/frontend/)
- `index.ts`: Frontend utilities
- `components/`: React components
- `hooks/`: Custom React hooks

### WASM (src/wasm.ts)
- WebAssembly module loading
- Go runtime integration

## CI/CD Integration

Coverage reports are automatically generated during CI/CD:

```yaml
# Example GitHub Actions
- name: Test Coverage
  run: npm run test:coverage

- name: Upload to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Best Practices

1. **Aim for 80%+ overall coverage**
   - Core functionality: 90%+
   - Utilities: 85%+
   - Edge cases: 70%+

2. **Focus on meaningful coverage**
   - Test business logic first
   - Cover error paths
   - Test edge cases

3. **Keep tests maintainable**
   - One assertion per test when possible
   - Use descriptive test names
   - Keep tests isolated

4. **Review coverage regularly**
   - Check coverage before merging PRs
   - Trend coverage over time
   - Investigate coverage drops

## Common Issues

### Coverage Not Increasing
- Ensure tests are actually running
- Check that code is imported/used
- Verify test file matches test pattern

### High Coverage but Bugs
- Focus on meaningful tests, not just line coverage
- Test integration between modules
- Add tests for reported bugs

### Slow Coverage Generation
- Run `npm run test:coverage` for full report
- Use `npm run test:watch` for development
- Consider running coverage for changed files only

## Tools

- **Jest**: Test runner and coverage tool
- **Istanbul/NYC**: Coverage instrumentation
- **lcov**: Coverage data format
- **HTML Report**: Visual coverage inspector

## Resources

- [Jest Coverage Documentation](https://jestjs.io/docs/coverage)
- [Istanbul Documentation](https://istanbul.js.org/)
- [Test Coverage Best Practices](https://martinfowler.com/articles/testing-strategies.html)
