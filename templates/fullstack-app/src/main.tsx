import { render, hydrate, jsx } from 'frontend-hamroun';
// Import Tailwind CSS
import './styles.css';

// Type declaration for window.__INITIAL_STATE__
declare global {
  interface Window {
    __INITIAL_STATE__?: any;
  }
}

// Get initial state from server
const initialState = window.__INITIAL_STATE__ || {
  route: window.location.pathname,
  timestamp: new Date().toISOString(),
  serverRendered: false,
  data: {
    users: null,
    posts: null
  }
};

console.log('[Client] Initial state:', initialState);

// Create a mutable variable for hydration state
let isHydrating = document.getElementById('root')?.innerHTML.trim() !== '';

// Function to handle navigation
async function handleRouteChange(path: string, isPushState = true) {
  try {
    console.log(`[Router] Navigating to: ${path}`);
    
    // Update URL if needed
    if (isPushState) {
      window.history.pushState(null, '', path);
    }
    
    // Dynamically load the page component based on the path
    const normalizedPath = path === '/' ? 'index' : path.replace(/^\//, '');
    
    let Page;
    try {
      // Dynamic import for the page component
      const module = await import(`./pages/${normalizedPath}.tsx`);
      Page = module.default;
    } catch (error) {
      console.warn(`[Router] Could not load page for ${path}, trying index file`);
      try {
        // Try loading index file in directory
        const module = await import(`./pages/${normalizedPath}/index.tsx`);
        Page = module.default;
      } catch (innerError) {
        console.error(`[Router] Failed to load page component for ${path}`);
        
        // Try to load 404 page
        try {
          const notFoundModule = await import(`./pages/404.tsx`);
          Page = notFoundModule.default;
        } catch (notFoundError) {
          // If all fails, render a simple not found message
          const rootElement = document.getElementById('root');
          if (rootElement) {
            render(
              <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <h1>Page Not Found</h1>
                <p>The page you requested could not be found.</p>
                <a href="/" style={{ color: '#0066cc' }}>Go to Home</a>
              </div>,
              rootElement
            );
          }
          return;
        }
      }
    }
    
    // Get the current page props
    let pageProps = initialState.pageProps || {};
    
    // If the page defines getServerSideProps, fetch data
    if (Page.getServerSideProps) {
      try {
        const response = await fetch(`/api/__props${path}`);
        if (response.ok) {
          const data = await response.json();
          pageProps = data.props || {};
        }
      } catch (error) {
        console.error('[Router] Error fetching page props:', error);
      }
    }
    
    // Update the state with current route
    const updatedState = {
      ...initialState,
      route: path,
      pageProps
    };
    
    // Render the page
    const rootElement = document.getElementById('root');
    if (!rootElement) return;
    
    if (isHydrating && path === initialState.route) {
      console.log('[Client] Hydrating server-rendered content');
      hydrate(<Page {...pageProps} initialState={updatedState} />, rootElement);
      isHydrating = false;
    } else {
      console.log('[Client] Rendering client-side');
      render(<Page {...pageProps} initialState={updatedState} />, rootElement);
    }
  } catch (error) {
    console.error('[Router] Navigation error:', error);
  }
}

// Handle initial route
handleRouteChange(window.location.pathname, false);

// Handle client-side navigation
document.addEventListener('click', (e) => {
  let target = e.target as HTMLElement | null;
  
  // Find closest anchor element
  while (target && target.tagName !== 'A') {
    target = target.parentElement;
    if (!target) break;
  }
  
  if (target && 
      target.tagName === 'A' && 
      target.getAttribute('href') && 
      target.getAttribute('href')?.startsWith('/') && 
      !target.getAttribute('href')?.startsWith('//') && 
      !target.getAttribute('target')) {
    
    e.preventDefault();
    const href = target.getAttribute('href') || '/';
    handleRouteChange(href);
  }
});

// Handle back/forward navigation
window.addEventListener('popstate', () => {
  handleRouteChange(window.location.pathname, false);
});

// Set up socket.io for live reload in development
if (typeof io !== 'undefined') {
  const socket = io();
  socket.on('reload', () => {
    console.log('[Dev] Reloading page due to file changes');
    window.location.reload();
  });
}
