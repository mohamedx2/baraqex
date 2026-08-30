# Frontend Hamroun SSR Template

This is a comprehensive server-side rendering (SSR) example using Frontend Hamroun.

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

3. Open your browser at http://localhost:3000

## Core Features

This template demonstrates:

### Server-Side Rendering
- Pre-rendering of components on the server
- Hydration of server-rendered content on the client
- Data fetching during server rendering
- AI-powered meta tag generation

### Automatic File-Based Routing
- Pages are automatically rendered based on their file path in the `pages` directory
- For example:
  - `/pages/index.js` → `/` route
  - `/pages/about.js` → `/about` route
  - `/pages/blog/index.js` → `/blog` route
  - `/pages/users/[id].js` → `/users/:id` dynamic route

### API Integration
- RESTful API endpoints
- Dynamic API routing
- API middleware for validation and security
- File-based API structure

### Database Integration
- MongoDB, MySQL, and PostgreSQL support
- ORM-like query interface
- Connection pooling
- Transaction support

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing and validation
- Token refresh mechanism

### Performance Optimization
- Caching strategies
- Response compression
- Static asset optimization
- Efficient metadata handling

## Implementation Examples

### Creating Components

Use the `jsx` or `createElement` function from 'frontend-hamroun':

```jsx
import { jsx } from 'frontend-hamroun';

export default function MyComponent(props) {
  return jsx('div', { className: "container" }, [
    jsx('h1', {}, "Hello World"),
    jsx('p', {}, `Props value: ${props.value}`)
  ]);
}
```

### Creating API Routes

Create files in the `api` directory following this pattern:

```typescript
// api/users/index.ts
import { Request, Response } from 'express';

export const get = (req: Request, res: Response) => {
  res.json({ users: [...] });
};

export const post = (req: Request, res: Response) => {
  // Create user
  res.status(201).json({ success: true });
};
```

### Database Usage

```typescript
import { Server } from 'frontend-hamroun/server';

const server = new Server({
  db: {
    url: process.env.DATABASE_URL,
    type: 'mongodb' // or 'mysql', 'postgres'
  }
});

// Get typed database instance
const db = server.getDatabase();
const users = await db.query('SELECT * FROM users'); // For SQL
const docs = await db.getMongoDb().collection('users').find().toArray(); // For MongoDB
```

### Authentication

```typescript
import { AuthService } from 'frontend-hamroun/server';

const auth = new AuthService({
  secret: process.env.JWT_SECRET,
  expiresIn: '24h'
});

// Protect routes
app.get('/api/protected', auth.requireAuth(), (req, res) => {
  res.json({ message: "Authenticated!" });
});

// Create user & login
const hashedPassword = await auth.hashPassword(password);
const token = auth.generateToken(user);
```

### Advanced Middleware

```typescript
import { rateLimit, requestLogger, errorHandler } from 'frontend-hamroun/server';

app.use(requestLogger);
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(errorHandler);
```

## File-Based Routing Examples

### Static Routes
Create files in the `pages` directory:

```jsx
// pages/index.js - Maps to "/"
export default function HomePage() {
  return <h1>Home Page</h1>;
}

// pages/about.js - Maps to "/about"
export default function AboutPage() {
  return <h1>About Us</h1>;
}

// pages/contact/index.js - Maps to "/contact"
export default function ContactPage() {
  return <h1>Contact Us</h1>;
}
```

### Dynamic Routes
Use brackets in filenames to define dynamic parameters:

```jsx
// pages/users/[id].js - Maps to "/users/:id"
export default function UserPage({ params }) {
  return <h1>User Profile: {params.id}</h1>;
}

// pages/blog/[category]/[slug].js - Maps to "/blog/:category/:slug"
export default function BlogPost({ params }) {
  return (
    <div>
      <h1>Blog Post: {params.slug}</h1>
      <p>Category: {params.category}</p>
    </div>
  );
}
```

## Next Steps

Explore the full API documentation for more advanced features and customization options.
