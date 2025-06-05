# Full-Stack Frontend Hamroun App

A complete full-stack application with API routes and SSR.

## Features

- ✅ Server-side rendering with hydration
- ✅ API routes in `src/api/`
- ✅ Page-based routing in `src/pages/`
- ✅ Frontend Hamroun hooks support
- ✅ Express.js backend
- ✅ Static file serving

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
src/
  ├── pages/           # Page components (SSR)
  │   └── index.js     # Homepage
  └── api/             # API routes
      └── hello.js     # Example API endpoint
```

## Available Endpoints

- **Homepage**: http://localhost:3000
- **API Hello**: http://localhost:3000/api/hello

## Adding Pages

Create new files in `src/pages/`:
- `src/pages/about.js` → `/about`
- `src/pages/contact.js` → `/contact`
- `src/pages/blog/index.js` → `/blog`

## Adding API Routes

Create new files in `src/api/`:
- `src/api/users.js` → `/api/users`
- `src/api/posts/index.js` → `/api/posts`
- `src/api/posts/[id].js` → `/api/posts/:id`

Each API file should export functions named after HTTP methods:
```javascript
export function get(req, res) { /* ... */ }
export function post(req, res) { /* ... */ }
export function put(req, res) { /* ... */ }
export function delete(req, res) { /* ... */ }
```
