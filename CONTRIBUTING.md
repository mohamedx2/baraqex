# Contributing to Baraqex

Thank you for your interest in contributing to Baraqex! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Style Guide](#style-guide)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and supportive.

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**
- (Optional) **Go** >= 1.21 for WASM development

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/baraqex.git
cd baraqex
git remote add upstream https://github.com/mohamedx2/baraqex.git
```

---

## Development Setup

```bash
# Install dependencies
npm install

# Run tests to ensure everything works
npm test

# Build the project
npm run build

# Start development mode
npm run dev
```

---

## Project Structure

```
baraqex/
├── src/                    # Source code
│   ├── index.ts           # Main entry point
│   ├── browser.ts         # Browser-specific code
│   ├── server/            # Server module
│   │   ├── index.ts       # Server entry
│   │   ├── middleware.ts  # Express middleware
│   │   ├── auth.ts        # Authentication
│   │   ├── database.ts    # Database adapters
│   │   └── utils.ts       # Utilities
│   └── wasm.ts            # WASM integration
├── tests/                  # Test files
│   ├── server/            # Server tests
│   └── setup.ts           # Test configuration
├── benchmarks/            # Performance benchmarks
├── templates/             # Project templates
├── bin/                   # CLI scripts
└── dist/                  # Build output
```

---

## Making Changes

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test improvements
- `chore/` - Maintenance

```bash
git checkout -b feature/my-awesome-feature
```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(server): add WebSocket support`
- `fix(auth): resolve token expiration issue`
- `docs(readme): update installation guide`
- `test(middleware): add rate limiting tests`

---

## Testing

### Run All Tests

```bash
npm test
```

### Run with Coverage

```bash
npm run test:coverage
```

### Run Specific Tests

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# Benchmarks
npm run test:benchmarks
```

### Writing Tests

- Place tests in `tests/` directory
- Name test files `*.test.ts`
- Use descriptive test names

```typescript
describe('AuthService', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const hash = await authService.hashPassword('secret');
      expect(hash).toBeDefined();
      expect(hash).not.toBe('secret');
    });
  });
});
```

---

## Submitting a Pull Request

### Before Submitting

1. ✅ Tests pass: `npm test`
2. ✅ Types check: `npm run typecheck`
3. ✅ Lint passes: `npm run lint`
4. ✅ Build succeeds: `npm run build`

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests added/updated
- [ ] All tests pass

## Screenshots (if applicable)
```

### Review Process

1. Create a Pull Request
2. Automated checks run (CI)
3. Maintainer reviews code
4. Address feedback
5. PR merged! 🎉

---

## Style Guide

### TypeScript

- Use TypeScript for all source files
- Enable strict mode
- Export types explicitly

```typescript
// ✅ Good
export interface ServerConfig {
  port: number;
  apiDir?: string;
}

// ❌ Avoid
export type ServerConfig = any;
```

### Formatting

- Use 2-space indentation
- Use single quotes
- Add trailing commas
- Max line length: 100 characters

### Documentation

- Add JSDoc comments for public APIs
- Update README when adding features
- Include examples in documentation

```typescript
/**
 * Creates a new server instance.
 * 
 * @param config - Server configuration options
 * @returns Server instance
 * 
 * @example
 * ```typescript
 * const server = new Server({ port: 3000 });
 * await server.start();
 * ```
 */
export class Server {
  // ...
}
```

---

## Community

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and ideas
- **Discord** - Real-time chat

---

## Recognition

Contributors are recognized in:
- [CONTRIBUTORS.md](CONTRIBUTORS.md)
- Release notes
- README acknowledgements

Thank you for contributing! 🙏
