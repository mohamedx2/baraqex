# Frontend Hamroun SSR Template

🚀 Advanced SSR template with hooks, modern design, and interactive components.

## Features

- ✅ Server-Side Rendering (SSR)
- ✅ Client-Side Hydration
- ✅ React-like Hooks (useState, useEffect, useRef, useMemo)
- ✅ Modern TypeScript Support
- ✅ Interactive Components (Counter, Timer, Todo List)
- ✅ Theme Switching (Light/Dark)
- ✅ Responsive Design
- ✅ Performance Optimized

## Getting Started

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start the development server
npm run dev
```

Visit http://localhost:3000 to see your app.

## Project Structure

```
src/
  ├── App.tsx          # Main application component
  ├── server.ts        # Express server with SSR
  └── client.tsx       # Client-side hydration
dist/                  # Built files
esbuild.config.js      # Build configuration
```

## Available Scripts

- `npm run dev` - Build and start development server
- `npm run build` - Build for production
- `npm run start` - Start the server
- `npm run clean` - Clean and reinstall dependencies

## Custom Hooks

The template includes several custom hooks:

- `useTimer` - Timer/stopwatch functionality
- `useCounter` - Counter with step controls
- `useTodos` - Todo list management
- `useTheme` - Theme switching

## Learn More

- [Frontend Hamroun Documentation](https://github.com/hamroun96/frontend-hamroun)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Express.js Documentation](https://expressjs.com/)
