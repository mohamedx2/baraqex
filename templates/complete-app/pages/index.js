import { jsx, useState, useEffect, useMemo, useRef, useContext, createContext } from 'frontend-hamroun';

// Create a context for theme
const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

// Demo counter component using hooks
function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const countRef = useRef(count);
  const { theme } = useContext(ThemeContext);
  
  // Update ref when count changes
  useEffect(() => {
    countRef.current = count;
    console.log('Count updated to:', count);
  }, [count]);
  
  // Use memoization for expensive calculation
  const isEven = useMemo(() => {
    console.log('Computing isEven...');
    return count % 2 === 0;
  }, [count]);
  
  const themeClass = theme === 'dark' ? 'dark-theme' : 'light-theme';
  
  return jsx('div', { className: `counter ${themeClass}` }, [
    jsx('h3', {}, 'Interactive Counter'),
    jsx('p', {}, [
      jsx('span', {}, `Current count: ${count} `),
      jsx('span', { className: 'badge' }, isEven ? 'even' : 'odd')
    ]),
    jsx('div', { className: 'button-group' }, [
      jsx('button', { 
        onClick: () => setCount(c => c - 1),
        className: 'btn'
      }, 'Decrease'),
      jsx('button', { 
        onClick: () => setCount(c => c + 1),
        className: 'btn primary'
      }, 'Increase'),
      jsx('button', { 
        onClick: () => setCount(initialCount),
        className: 'btn secondary'
      }, 'Reset')
    ])
  ]);
}

// ServerInfo component to show server time
function ServerInfo({ serverTime }) {
  const [clientTime, setClientTime] = useState(new Date().toISOString());
  const [timeVisible, setTimeVisible] = useState(true);
  
  // Update client time every second
  useEffect(() => {
    if (!timeVisible) return;
    
    const interval = setInterval(() => {
      setClientTime(new Date().toISOString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timeVisible]);
  
  return jsx('div', { className: 'server-info card' }, [
    jsx('h3', {}, 'Server/Client Time'),
    jsx('button', { 
      onClick: () => setTimeVisible(!timeVisible),
      className: 'btn small'
    }, timeVisible ? 'Hide Times' : 'Show Times'),
    timeVisible && jsx('div', { className: 'time-container' }, [
      jsx('p', {}, [
        jsx('strong', {}, 'Server Time: '),
        jsx('span', {}, serverTime)
      ]),
      jsx('p', {}, [
        jsx('strong', {}, 'Client Time: '),
        jsx('span', {}, clientTime)
      ]),
      jsx('p', { className: 'note' }, 'The client time updates every second to demonstrate client-side effects.')
    ])
  ]);
}

// Main page component
export default function HomePage(props) {
  const [theme, setTheme] = useState('light');
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
  
  const themeValue = useMemo(() => ({ theme, toggleTheme }), [theme]);
  
  return jsx(ThemeContext.Provider, { value: themeValue }, [
    jsx('div', { className: `container ${theme}-theme` }, [
      jsx('header', { className: 'header' }, [
        jsx('div', { className: 'logo' }, [
          jsx('h1', {}, 'Frontend Hamroun'),
          jsx('span', { className: 'version' }, 'v1.2')
        ]),
        jsx('button', { 
          onClick: toggleTheme,
          className: 'theme-toggle'
        }, theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode')
      ]),
      
      jsx('main', {}, [
        jsx('section', { className: 'hero' }, [
          jsx('h2', {}, 'Welcome to the Complete Server-Side Rendered App'),
          jsx('p', {}, 'This demo showcases the power of Frontend Hamroun framework with server-side rendering and hydration.')
        ]),
        
        jsx('div', { className: 'grid' }, [
          jsx('div', { className: 'card' }, [
            jsx('h3', {}, 'Framework Features'),
            jsx('ul', { className: 'feature-list' }, [
              jsx('li', {}, 'Server-Side Rendering'),
              jsx('li', {}, 'Client-Side Hydration'),
              jsx('li', {}, 'React-like Hooks (useState, useEffect, useMemo, useRef)'),
              jsx('li', {}, 'Context API for State Management'),
              jsx('li', {}, 'WebAssembly Integration'),
              jsx('li', {}, 'SEO Optimization')
            ])
          ]),
          
          jsx('div', { className: 'card' }, [
            jsx(Counter, { initialCount: props.params.count ? parseInt(props.params.count) : 0 })
          ]),
          
          jsx('div', { className: 'card' }, [
            jsx(ServerInfo, { serverTime: props.api?.serverTime || 'Not available' })
          ]),
          
          jsx('div', { className: 'card' }, [
            jsx('h3', {}, 'Navigation'),
            jsx('nav', { className: 'nav-links' }, [
              jsx('a', { href: '/', className: 'active' }, 'Home'),
              jsx('a', { href: '/about', className: '' }, 'About'),
              jsx('a', { href: '/users', className: '' }, 'Users'),
              jsx('a', { href: '/wasm-demo', className: '' }, 'WebAssembly Demo')
            ])
          ])
        ])
      ]),
      
      jsx('footer', {}, [
        jsx('p', {}, [
          '© ',
          jsx('span', {}, new Date().getFullYear()),
          ' Frontend Hamroun Framework. Built with 💙 using SSR and hydration.'
        ])
      ])
    ])
  ]);
}

// Static metadata for SEO
HomePage.getTitle = (props) => 'Frontend Hamroun - Modern JavaScript Framework';
HomePage.getDescription = (props) => 'A server-side rendered demo of the Frontend Hamroun framework with React-like hooks and component architecture.';
