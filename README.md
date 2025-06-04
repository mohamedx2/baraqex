# Baraqex 🚀

A powerful, modern JavaScript/TypeScript framework for building universal web applications with seamless WebAssembly integration, server-side rendering, and full-stack capabilities.

## ✨ Features

### 🎯 Core Features
- **Universal JSX Support** - Modern React-like components without dependencies
- **WebAssembly Integration** - Seamless Go WASM support for both browser and Node.js
- **Server-Side Rendering** - Built-in SSR with hydration support
- **Full-Stack Framework** - Complete backend server with API routes
- **TypeScript First** - Full TypeScript support with excellent IntelliSense
- **Zero Dependencies** - Lightweight core with optional features

### 🌐 WebAssembly Features
- **Browser WASM** - Load and execute Go WASM modules in the browser
- **Server WASM** - Run Go WASM functions in Node.js environment
- **Unified API** - Identical interface for browser and server environments
- **Hot Reloading** - Development support with fast refresh

### 🔧 Backend Features
- **Express Integration** - Built on Express.js for reliability
- **API Routes** - File-based API routing system
- **Authentication** - JWT-based auth with middleware support
- **Database Support** - MongoDB, MySQL, PostgreSQL adapters
- **Static Serving** - Efficient static file serving

## 📦 Installation

```bash
npm install baraqex
```

## 🚀 Quick Start

### Frontend Usage

```javascript
import { jsx, useState } from 'baraqex';
import { loadGoWasm, callWasmFunction } from 'baraqex';

function App() {
  const [count, setCount] = useState(0);
  const [wasmReady, setWasmReady] = useState(false);

  // Load WebAssembly module
  useEffect(() => {
    async function initWasm() {
      await loadGoWasm('/app.wasm');
      setWasmReady(true);
    }
    initWasm();
  }, []);

  const handleCalculate = () => {
    if (wasmReady) {
      // Call Go WASM function
      const result = callWasmFunction('calculate', count);
      console.log('WASM result:', result);
    }
  };

  return (
    <div>
      <h1>Baraqex App</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <button onClick={handleCalculate} disabled={!wasmReady}>
        Calculate with WASM
      </button>
    </div>
  );
}

export default App;
```

### Server Usage

```javascript
import { createServer } from 'baraqex/server';
import { loadGoWasmFromFile, callWasmFunction } from 'baraqex/server';

// Create server
const server = createServer({
  port: 3000,
  apiDir: './api',
  pagesDir: './pages',
  staticDir: './public'
});

// Load WASM for server-side processing
async function initServerWasm() {
  await loadGoWasmFromFile('./compute.wasm');
  console.log('Server WASM ready!');
}

// Start server
server.start().then(() => {
  console.log('Server running on http://localhost:3000');
  initServerWasm();
});
```

## 📖 Documentation

### WebAssembly Integration

#### Browser WASM

```javascript
import { loadGoWasm, callWasmFunction, isWasmReady, getWasmFunctions } from 'baraqex';

// Load WASM module
await loadGoWasm('/example.wasm', {
  debug: true,
  onLoad: (instance) => {
    console.log('WASM loaded!', instance);
  }
});

// Check if ready
if (isWasmReady()) {
  // Get available functions
  const functions = getWasmFunctions();
  console.log('Available functions:', functions);
  
  // Call functions
  const greeting = callWasmFunction('goHello', 'World');
  const sum = callWasmFunction('goAdd', 10, 20);
  const fibonacci = callWasmFunction('goFibonacci', 10);
}
```

#### Server WASM

```javascript
import { loadGoWasmFromFile, callWasmFunction } from 'baraqex/server';

// Load WASM from file
await loadGoWasmFromFile('./example.wasm', {
  debug: true,
  goWasmPath: './wasm_exec.cjs'
});

// Use identical API as browser
const result = callWasmFunction('goCalculate', 42);
```

#### Go WASM Example

```go
// main.go
package main

import (
    "fmt"
    "syscall/js"
)

func goHello(this js.Value, args []js.Value) interface{} {
    name := args[0].String()
    return fmt.Sprintf("Hello, %s from Go WASM!", name)
}

func goAdd(this js.Value, args []js.Value) interface{} {
    a := args[0].Float()
    b := args[1].Float()
    return a + b
}

func main() {
    // Register functions
    js.Global().Set("goHello", js.FuncOf(goHello))
    js.Global().Set("goAdd", js.FuncOf(goAdd))
    
    fmt.Println("Go WASM ready!")
    
    // Keep running
    select {}
}
```

Build with:
```bash
GOOS=js GOARCH=wasm go build -o example.wasm main.go
```

### Server-Side Rendering

#### Page Components

```javascript
// pages/index.js
import { jsx } from 'baraqex';

export default function HomePage(props) {
  return (
    <html>
      <head>
        <title>My App</title>
      </head>
      <body>
        <h1>Welcome to Baraqex!</h1>
        <p>Server time: {props.api.serverTime}</p>
      </body>
    </html>
  );
}

// Optional: Add metadata
HomePage.getTitle = (props) => 'Home - My App';
HomePage.getDescription = (props) => 'Welcome to my application';
```

#### API Routes

```javascript
// api/users.js
export async function get(req, res) {
  // GET /api/users
  const users = await getUsersFromDatabase();
  res.json({ users });
}

export async function post(req, res) {
  // POST /api/users
  const newUser = await createUser(req.body);
  res.json({ user: newUser });
}

// api/users/[id].js
export async function get(req, res) {
  // GET /api/users/:id
  const user = await getUserById(req.params.id);
  res.json({ user });
}
```

### Database Integration

```javascript
import { Database } from 'baraqex/server';

// MongoDB
const db = new Database({
  type: 'mongodb',
  url: 'mongodb://localhost:27017/myapp'
});

await db.connect();
const collection = db.getMongoDb().collection('users');

// MySQL
const db = new Database({
  type: 'mysql',
  url: 'mysql://user:pass@localhost:3306/myapp'
});

await db.connect();
const users = await db.query('SELECT * FROM users WHERE active = ?', [true]);

// PostgreSQL
const db = new Database({
  type: 'postgres',
  url: 'postgresql://user:pass@localhost:5432/myapp'
});

await db.connect();
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

### Authentication

```javascript
import { AuthService } from 'baraqex/server';

const auth = new AuthService({
  secret: 'your-secret-key',
  expiresIn: '24h'
});

// In your API routes
export async function post(req, res) {
  const { username, password } = req.body;
  
  // Validate user
  const user = await validateUser(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Generate token
  const token = auth.generateToken(user);
  res.json({ token, user });
}

// Protected route
export const middleware = [auth.requireAuth()];

export async function get(req, res) {
  // req.user is available
  res.json({ user: req.user });
}
```

## 🛠️ Development

### Project Structure

```
my-app/
├── src/
│   ├── pages/          # SSR pages
│   │   ├── index.js    # Home page
│   │   └── about.js    # About page
│   ├── api/            # API routes
│   │   ├── users.js    # /api/users
│   │   └── auth/       # /api/auth/*
│   └── components/     # Reusable components
├── public/             # Static files
│   ├── app.wasm       # WebAssembly modules
│   └── styles.css     # Stylesheets
├── wasm/              # Go WASM source
│   └── main.go        # Go functions
└── package.json
```

### Build Scripts

```json
{
  "scripts": {
    "dev": "baraqex dev",
    "build": "baraqex build",
    "start": "baraqex start",
    "build:wasm": "GOOS=js GOARCH=wasm go build -o public/app.wasm wasm/main.go"
  }
}
```

### Development Server

```javascript
import { createDevServer } from 'baraqex/server';

const server = createDevServer({
  port: 3000,
  enableCors: true
});

// Enable SSR with hot reloading
server.enableSSR({ hydratable: true });

await server.start();
```

## 🔧 Configuration

### Server Configuration

```javascript
import { createServer } from 'baraqex/server';

const server = createServer({
  port: process.env.PORT || 3000,
  apiDir: './src/api',
  pagesDir: './src/pages',
  staticDir: './public',
  enableCors: true,
  corsOptions: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  db: {
    type: 'mongodb',
    url: process.env.DATABASE_URL
  },
  auth: {
    secret: process.env.JWT_SECRET,
    expiresIn: '7d'
  }
});
```

### WASM Configuration

```javascript
// Browser
await loadGoWasm('/app.wasm', {
  debug: process.env.NODE_ENV === 'development',
  importObject: {
    // Custom WASM imports
  },
  onLoad: (instance) => {
    console.log('WASM loaded with exports:', instance.exports);
  }
});

// Server
await loadGoWasmFromFile('./app.wasm', {
  debug: true,
  goWasmPath: './wasm_exec.cjs'
});
```

## 📊 Performance

### WebAssembly Benefits
- **Near-native performance** for compute-intensive tasks
- **Memory efficiency** with direct memory access
- **Parallel processing** capabilities
- **Type safety** with compiled languages

### Server Optimizations
- **Built-in caching** for static assets
- **Compression** support (gzip, brotli)
- **HTTP/2** ready
- **Cluster mode** for production

## 🧪 Testing

### WASM Testing

```javascript
// test-wasm.js
import { loadGoWasmFromFile, callWasmFunction } from 'baraqex/server';

async function testWasm() {
  await loadGoWasmFromFile('./example.wasm');
  
  // Test functions
  const greeting = callWasmFunction('goHello', 'Test');
  console.assert(greeting.includes('Test'), 'Hello function works');
  
  const sum = callWasmFunction('goAdd', 5, 3);
  console.assert(sum === 8, 'Add function works');
  
  console.log('All WASM tests passed!');
}

testWasm();
```

### Server Testing

```javascript
import request from 'supertest';
import { createServer } from 'baraqex/server';

const server = createServer();
const app = server.getExpressApp();

describe('API Routes', () => {
  test('GET /api/users', async () => {
    const response = await request(app)
      .get('/api/users')
      .expect(200);
    
    expect(response.body).toHaveProperty('users');
  });
});
```

## 🚀 Deployment

### Production Build

```bash
# Build WASM modules
npm run build:wasm

# Build application
npm run build

# Start production server
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Go for WASM building
RUN apk add --no-cache go

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build WASM
RUN npm run build:wasm

# Build app
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL=mongodb://localhost:27017/myapp

# Authentication
JWT_SECRET=your-super-secret-key

# WASM
WASM_DEBUG=false
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and add tests
4. Commit: `git commit -m 'Add amazing feature'`
5. Push: `git push origin feature/amazing-feature`
6. Submit a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [www.baraqex.tech](https://www.baraqex.tech)
- **Website**: [www.baraqex.tech](https://www.baraqex.tech)
- **Issues**: [GitHub Issues](https://github.com/hamroun/baraqex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/hamroun/baraqex/discussions)
- **Discord**: [Join our community](https://discord.gg/baraqex)

## 🎯 Examples

Check out the [examples directory](./examples) for complete sample applications:

- **Basic WASM App** - Simple calculator with Go WASM
- **Full-Stack Todo** - Complete CRUD app with auth
- **Real-time Chat** - WebSocket integration
- **E-commerce Site** - Complex SSR application
- **Data Visualization** - WASM-powered charts

## 🔗 Related Projects

- **Go WASM Runtime**: Standard Go WebAssembly support
- **Express.js**: The underlying server framework
- **TypeScript**: Type safety and developer experience
- **Official Website**: [www.baraqex.tech](https://www.baraqex.tech)

---

**Made with ❤️ by the Baraqex team**

*Build universal, high-performance web applications with the power of WebAssembly and modern JavaScript.*

**Learn more at [www.baraqex.tech](https://www.baraqex.tech)**
