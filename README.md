<div align="center">

<img src="https://raw.githubusercontent.com/mohamedx2/baraqex/main/assets/logo.svg" alt="Baraqex Logo" width="180" height="180">

# Baraqex

### ⚡ The Full-Stack Framework with WASM Superpowers

Build universal web applications with React-like syntax and Go-powered performance.

[![npm version](https://img.shields.io/npm/v/baraqex?color=blue&label=npm)](https://www.npmjs.com/package/baraqex)
[![npm downloads](https://img.shields.io/npm/dm/baraqex?color=blue)](https://www.npmjs.com/package/baraqex)
[![GitHub stars](https://img.shields.io/github/stars/mohamedx2/baraqex?style=social)](https://github.com/mohamedx2/baraqex)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Docs](https://img.shields.io/badge/Docs-baraqex.tech-blue)](https://www.baraqex.tech)

[Get Started](#-quick-start) · [Documentation](https://www.baraqex.tech/docs) · [Examples](#-examples) · [Contributing](#-contributing)

</div>

---

## Why Baraqex?

| Feature | Baraqex | Others |
|---------|---------|--------|
| 🚀 **WASM Integration** | Native Go/WASM support | Manual setup required |
| 🔄 **Universal Rendering** | SSR + CSR + Static | Framework-specific |
| ⚡ **Zero Config** | Works out of the box | Complex configuration |
| 🎯 **Full-Stack** | Frontend + Backend + API | Separate tools needed |
| 📦 **Tiny Bundle** | < 15KB gzipped | Often 50KB+ |

---

## ✨ Features

- **🔥 WebAssembly First** - Run Go code in the browser at near-native speed
- **⚛️ React-like Syntax** - Familiar JSX with hooks (`useState`, `useEffect`, etc.)
- **🌐 Universal Rendering** - SSR, CSR, and Static Generation
- **🛣️ File-based Routing** - Automatic API routes from your file structure
- **🔐 Built-in Auth** - JWT authentication with password hashing
- **🗄️ Database Adapters** - MongoDB, PostgreSQL, MySQL out of the box
- **📡 Real-time** - WebSocket support for live updates
- **🎨 TypeScript** - Full type safety and IntelliSense
- **🧪 Tested** - 140+ tests with 56% coverage

> **Built on [frontend-hamroun](https://www.npmjs.com/package/frontend-hamroun)** - The lightweight React-like core (~8KB gzipped)

---

## 🚀 Quick Start

### Create a New Project

```bash
npx create-baraqex-app my-app
cd my-app
npm run dev
```

### Or Install Manually

```bash
npm install baraqex
```

---

## 📖 Basic Usage

### Create a Component

```jsx
import { jsx, useState } from 'baraqex';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <h1>Count: {count}</h1>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

### Create an API Route

```javascript
// api/users.js - automatically becomes /api/users
export async function get(req, res) {
  const users = await db.query('SELECT * FROM users');
  res.json(users);
}

export async function post(req, res) {
  const user = await db.insert('users', req.body);
  res.status(201).json(user);
}
```

### Use WebAssembly

```jsx
import { loadGoWasm, callWasmFunction } from 'baraqex';

// Load your Go WASM module
await loadGoWasm('/math.wasm');

// Call Go functions from JavaScript
const result = callWasmFunction('fibonacci', 1000000);
console.log(result); // Computed in milliseconds!
```

### Start a Server

```javascript
import { Server } from 'baraqex/server';

const server = new Server({
  port: 3000,
  apiDir: './api',
  pagesDir: './pages',
  db: {
    type: 'postgres',
    url: process.env.DATABASE_URL
  },
  auth: {
    secret: process.env.JWT_SECRET
  }
});

await server.start();
// 🚀 Server running at http://localhost:3000
```

---

## 📚 Documentation

### Core Concepts

| Topic | Description |
|-------|-------------|
| [Components](docs/components.md) | Creating and composing components |
| [Hooks](docs/hooks.md) | useState, useEffect, useContext, and more |
| [Routing](docs/routing.md) | File-based and programmatic routing |
| [Server](docs/server.md) | Express-based server with middleware |
| [Database](docs/database.md) | MongoDB, PostgreSQL, MySQL adapters |
| [Authentication](docs/auth.md) | JWT tokens and password hashing |
| [WebAssembly](docs/wasm.md) | Go WASM integration guide |
| [SSR](docs/ssr.md) | Server-side rendering |

### API Reference

```typescript
// Browser APIs
import {
  jsx,
  Fragment,
  render,
  useState,
  useEffect,
  useContext,
  useRef,
  useMemo,
  useCallback,
  loadGoWasm,
  callWasmFunction,
  getWasmExports
} from 'baraqex';

// Server APIs
import {
  Server,
  Database,
  AuthService,
  ApiRouter,
  rateLimit,
  requestLogger,
  errorHandler
} from 'baraqex/server';
```

---

## 🎯 Examples

### Todo App with WASM

```jsx
import { jsx, useState, loadGoWasm, callWasmFunction } from 'baraqex';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');

  const addTodo = () => {
    // Use WASM for validation/processing
    const validated = callWasmFunction('validateTodo', input);
    if (validated) {
      setTodos([...todos, { id: Date.now(), text: input }]);
      setInput('');
    }
  };

  return (
    <div className="todo-app">
      <h1>📝 WASM Todo</h1>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add a todo..."
      />
      <button onClick={addTodo}>Add</button>
      <ul>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

### Full-Stack API

```javascript
// server.js
import { Server } from 'baraqex/server';

const server = new Server({
  port: 3000,
  db: { type: 'mongodb', url: 'mongodb://localhost:27017/myapp' },
  auth: { secret: 'your-secret-key' }
});

// Custom middleware
server.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

await server.start();
```

```javascript
// api/posts/[id].js - Dynamic routes
export async function get(req, res, { db }) {
  const post = await db.query(`SELECT * FROM posts WHERE id = $1`, [req.params.id]);
  res.json(post);
}
```

---

## 🏗️ Project Structure

```
my-app/
├── api/                 # API routes (file-based)
│   ├── users.js        # → /api/users
│   └── posts/
│       ├── index.js    # → /api/posts
│       └── [id].js     # → /api/posts/:id
├── pages/               # Page components
│   ├── index.jsx       # → /
│   └── about.jsx       # → /about
├── public/              # Static assets
├── src/
│   ├── components/     # Reusable components
│   └── wasm/           # Go WASM source files
├── package.json
└── baraqex.config.js   # Optional configuration
```

---

## ⚡ Performance

Baraqex is designed for speed:

| Metric | Value |
|--------|-------|
| Bundle Size | 14.2 KB (gzipped) |
| First Paint | < 50ms |
| Server Start | < 200ms |
| WASM Load | < 100ms |
| Rate Limit Check | < 0.01ms |

Run benchmarks yourself:

```bash
npm run benchmark
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific tests
npm run test:unit
npm run test:integration

# Run benchmarks
npm run test:benchmarks
```

---

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
# Clone the repo
git clone https://github.com/mohamedx2/baraqex.git
cd baraqex

# Install dependencies
npm install

# Run tests
npm test

# Start development
npm run dev
```

---

## 📦 Templates

Create projects with pre-configured templates:

```bash
# Basic app
npx create-baraqex-app my-app --template basic

# Full-stack with database
npx create-baraqex-app my-app --template fullstack

# SSR application
npx create-baraqex-app my-app --template ssr

# WASM-powered app
npx create-baraqex-app my-app --template wasm
```

---

## 🗺️ Roadmap

- [x] Core framework with JSX support
- [x] WebAssembly integration
- [x] Server-side rendering
- [x] Database adapters (MongoDB, PostgreSQL, MySQL)
- [x] Authentication system
- [x] CLI with project scaffolding
- [ ] Edge runtime support
- [ ] GraphQL integration
- [ ] React Server Components
- [ ] Incremental Static Regeneration
- [ ] Built-in caching layer

---

## 📄 License

MIT © [Mohamed X](https://github.com/mohamedx2)

---

<div align="center">

**[⬆ Back to Top](#baraqex)**

Made with ❤️ by the Baraqex team

**One Culture, One Framework** | **ثقافة واحدة، إطار عمل واحد**

[Website](https://www.baraqex.tech) · [Docs](https://www.baraqex.tech/docs) · [GitHub](https://github.com/mohamedx2/baraqex) · [npm](https://www.npmjs.com/package/baraqex) · [Arabic Community](https://www.baraqex.tech/arabic)

</div>
