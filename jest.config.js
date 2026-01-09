export default {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/benchmarks'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/*.benchmark.ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/tests/e2e/',
    '/tests/browser/'
  ],
  collectCoverageFrom: [
    'src/server/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/types.ts',
    // Exclude empty modules from coverage
    '!src/router/index.ts',
    '!src/forms/index.ts',
    '!src/store/index.ts',
    '!src/frontend/index.ts',
    // Exclude browser-only files (require browser environment)
    '!src/browser.ts',
    '!src/wasm.ts',
    '!src/index.ts',
    '!src/renderComponent.ts',
    '!src/server-renderer.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'lcov',
    'html',
    'json',
    'cobertura'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 45,
      lines: 40,
      statements: 40
    },
    // Per-file thresholds for critical modules
    './src/server/utils.ts': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/server/middleware.ts': {
      branches: 80,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './src/server/auth.ts': {
      branches: 65,
      functions: 90,
      lines: 75,
      statements: 75
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true
    }]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Display configuration
  verbose: false,
  // Performance
  maxWorkers: '50%',
  // Timeout for slow tests
  testTimeout: 10000
};
