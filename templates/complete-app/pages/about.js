import { jsx, useState, useEffect } from 'frontend-hamroun';

// Simple animation component to demonstrate useEffect
function FadeIn({ children, delay = 0 }) {
  const [opacity, setOpacity] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(1);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return jsx('div', { 
    style: `opacity: ${opacity}; transition: opacity 0.5s ease-in-out;` 
  }, children);
}

// Main about page component
export default function AboutPage(props) {
  const [activeSection, setActiveSection] = useState('overview');
  
  return jsx('div', { className: 'container' }, [
    jsx('header', { className: 'header' }, [
      jsx('h1', {}, 'About Frontend Hamroun'),
      jsx('a', { href: '/', className: 'back-link' }, '← Back to Home')
    ]),
    
    jsx('main', {}, [
      jsx('div', { className: 'about-nav' }, [
        jsx('button', { 
          className: activeSection === 'overview' ? 'active' : '',
          onClick: () => setActiveSection('overview')
        }, 'Overview'),
        jsx('button', { 
          className: activeSection === 'features' ? 'active' : '',
          onClick: () => setActiveSection('features')
        }, 'Features'),
        jsx('button', { 
          className: activeSection === 'team' ? 'active' : '',
          onClick: () => setActiveSection('team')
        }, 'Team')
      ]),
      
      // Overview section
      activeSection === 'overview' && jsx(FadeIn, {}, [
        jsx('section', { className: 'about-section' }, [
          jsx('h2', {}, 'Framework Overview'),
          jsx('p', {}, 'Frontend Hamroun is a lightweight JavaScript framework for building modern web applications with server-side rendering and client-side hydration.'),
          jsx('p', {}, 'Inspired by React and other modern frameworks, it provides a simple yet powerful component model with hooks for state management and side effects.'),
          jsx('p', {}, `This page was rendered on the server at ${props.api?.serverTime} and then hydrated on the client to provide interactivity.`)
        ])
      ]),
      
      // Features section
      activeSection === 'features' && jsx(FadeIn, {}, [
        jsx('section', { className: 'about-section' }, [
          jsx('h2', {}, 'Key Features'),
          jsx('ul', { className: 'feature-list expanded' }, [
            jsx('li', {}, [
              jsx('strong', {}, 'Server-Side Rendering (SSR):'),
              jsx('p', {}, 'Render pages on the server for faster initial load and improved SEO.')
            ]),
            jsx('li', {}, [
              jsx('strong', {}, 'Client-Side Hydration:'),
              jsx('p', {}, 'Add interactivity to server-rendered HTML without rebuilding the DOM.')
            ]),
            jsx('li', {}, [
              jsx('strong', {}, 'React-like Hooks:'),
              jsx('p', {}, 'Use useState, useEffect, useMemo, and useRef for managing component state and lifecycle.')
            ]),
            jsx('li', {}, [
              jsx('strong', {}, 'Context API:'),
              jsx('p', {}, 'Share state between components without prop drilling using createContext and useContext.')
            ]),
            jsx('li', {}, [
              jsx('strong', {}, 'WebAssembly Integration:'),
              jsx('p', {}, 'Leverage high-performance Go code compiled to WebAssembly for computationally intensive tasks.')
            ]),
            jsx('li', {}, [
              jsx('strong', {}, 'Automatic Route Handling:'),
              jsx('p', {}, 'File-based routing system similar to Next.js for intuitive page organization.')
            ])
          ])
        ])
      ]),
      
      // Team section
      activeSection === 'team' && jsx(FadeIn, {}, [
        jsx('section', { className: 'about-section' }, [
          jsx('h2', {}, 'The Team'),
          jsx('div', { className: 'team-grid' }, [
            jsx('div', { className: 'team-member' }, [
              jsx('div', { className: 'avatar' }, 'MH'),
              jsx('h3', {}, 'Mohamed Hamroun'),
              jsx('p', { className: 'title' }, 'Lead Framework Developer'),
              jsx('p', { className: 'bio' }, 'Creator of Frontend Hamroun and full-stack JavaScript enthusiast.')
            ]),
            jsx('div', { className: 'team-member' }, [
              jsx('div', { className: 'avatar' }, 'AI'),
              jsx('h3', {}, 'AI Assistant'),
              jsx('p', { className: 'title' }, 'Documentation & Support'),
              jsx('p', { className: 'bio' }, 'Helps with documentation, examples, and framework support.')
            ])
          ])
        ])
      ])
    ]),
    
    jsx('footer', {}, [
      jsx('p', {}, '© 2025 Frontend Hamroun Framework')
    ])
  ]);
}

// Static metadata for SEO
AboutPage.getTitle = () => 'About - Frontend Hamroun Framework';
AboutPage.getDescription = () => 'Learn about the Frontend Hamroun framework, its features, and the team behind it.';
