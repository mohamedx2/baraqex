import { useState, useEffect, useMemo, useRef, createContext } from 'frontend-hamroun';

// Create a theme context
const ThemeContext = createContext('light');

export function App() {
  // Initialize with a default state that works on both server and client
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const renderCount = useRef(0);
  
  // Client-side only effect
  useEffect(() => {
    if (typeof window !== 'undefined') {
      renderCount.current += 1;
      console.log('Component rendered', renderCount.current, 'times');
    }
    return () => console.log('Component unmounting');
  }, [count]);
  
  // Memoized value
  const doubled = useMemo(() => count * 2, [count]);
  
  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ 
        padding: '20px', 
        backgroundColor: theme === 'dark' ? '#333' : '#fff',
        color: theme === 'dark' ? '#fff' : '#333'
      }}>
        <h1>Server-Side Rendered App</h1>
        <div>
          <button 
            onClick={() => setCount(count - 1)}
            data-action="decrement"
          >-</button>
          <span style={{ margin: '0 10px' }}>{count}</span>
          <button 
            onClick={() => setCount(count + 1)}
            data-action="increment"
          >+</button>
        </div>
        <p>Doubled value: {doubled}</p>
        {typeof window !== 'undefined' && (
          <p>Render count: {renderCount.current}</p>
        )}
        <button 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          style={{ marginTop: '10px' }}
        >
          Toggle Theme ({theme})
        </button>
        <script dangerouslySetInnerHTML={{
          __html: `window.__INITIAL_STATE__ = ${JSON.stringify({ count: 0, theme: 'light' })};`
        }} />
      </div>
    </ThemeContext.Provider>
  );
}
