# Baraqex Basic App Template

A comprehensive demonstration of the Baraqex framework featuring all major capabilities and beautiful Tailwind CSS styling.

## 🚀 What's Included

This template showcases:

- **State Management**: useState, useEffect, useMemo, useRef hooks
- **Error Boundaries**: useErrorBoundary for graceful error handling  
- **Context API**: createContext and useContext for state sharing
- **Interactive Components**: Counter, Todo List, Error Testing
- **Responsive Design**: Tailwind CSS with dark/light mode
- **Performance Optimizations**: Memoization and efficient re-rendering

## 🎯 Features Demo

### Counter Component
- State management with useState
- Effect tracking with useEffect  
- Performance optimization with useMemo
- Render counting with useRef

### Todo List Component
- Complex state operations (add, toggle, delete)
- Form handling and validation
- Progress tracking
- List rendering optimization

### Error Boundary Test
- Error boundary implementation
- Graceful error recovery
- User-friendly error messages

### Context API Demo
- Theme switching across components
- Global state management
- Provider/Consumer pattern

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: Reusable button, card, and input styles
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: Full theme switching support
- **Animations**: Smooth transitions and hover effects

## 📁 Project Structure

```
src/
├── main.tsx         # Main application component
├── main.css         # Tailwind CSS imports and custom styles
└── App.jsx          # Alternative app component structure

public/
├── logo.png         # Baraqex logo (add your own)
└── index.html       # HTML template

dist/
├── bundle.js        # Compiled JavaScript
└── main.css         # Compiled CSS
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 About Baraqex

Baraqex is a powerful full-stack framework built on Frontend Hamroun that provides:

- ⚡ **Reactive State Management**: Intuitive hooks API
- 🌐 **Server-Side Rendering**: SEO-friendly and fast loading
- 🔄 **WebAssembly Support**: High-performance computing
- 🛡️ **Built-in Security**: Authentication and validation
- 📦 **Zero Configuration**: Works out of the box
- 🎯 **TypeScript Ready**: Full type safety support

## 🔧 Customization

### Adding Components

Create new components following the established pattern:

```tsx
import { jsx, useState } from 'baraqex';

function MyComponent() {
  const [state, setState] = useState('initial');
  
  return (
    <div className="card">
      <h3>My Component</h3>
      <p>State: {state}</p>
    </div>
  );
}
```

### Styling Guidelines

Use the established Tailwind classes and custom components:

```tsx
// Buttons
<button className="btn btn-primary">Primary Action</button>
<button className="btn btn-secondary">Secondary Action</button>

// Cards
<div className="card">Content here</div>

// Inputs
<input className="input" placeholder="Enter text..." />
```

### Adding New Features

1. Create component in `src/`
2. Import and use in `main.tsx`
3. Add to navigation if needed
4. Test error boundaries
5. Ensure responsive design

## 🚀 Deployment

The built application can be deployed to any static hosting service:

```bash
# Build production files
npm run build

# Deploy the dist/ folder contents
```

**Deployment Options:**
- Vercel: `vercel --prod`
- Netlify: Drag & drop the project folder
- GitHub Pages: Push to `gh-pages` branch
- Any static host: Upload `dist/` contents

## 📚 Learn More

- [Baraqex Documentation](https://www.baraqex.tech/docs)
- [Frontend Hamroun Hooks](https://frontend-hamroun.com/hooks)  
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

This template is part of the Baraqex framework. Contributions welcome!

---

**Happy coding with Baraqex! 🚀**
