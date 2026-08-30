import { hydrate, createElement, jsx } from 'frontend-hamroun';

// Add global jsx for compatibility
window.jsx = jsx;
window.createElement = createElement;

// Get the initial state from the server (if available)
const initialState = window.__INITIAL_STATE__ || {
  route: window.location.pathname
};

// Dynamically import the right page component based on the route
async function loadAndHydrateComponent() {
  try {
    const path = initialState.route || '/';
    const normalizedPath = path === '/' ? '/index' : path;
    
    console.log(`Loading component for path: ${normalizedPath}`);
    
    // Try to import the page component
    const module = await import(`./pages${normalizedPath}.js`).catch(() => 
      import(`./pages${normalizedPath}/index.js`)).catch(() => {
        console.warn(`No component found for ${normalizedPath}, falling back to index`);
        return import('./pages/index.js');
      });
    
    const PageComponent = module.default;
    
    if (!PageComponent) {
      throw new Error(`No default export found in module for ${normalizedPath}`);
    }
    
    // Find the root element - try both 'root' and 'app' IDs
    const rootElement = document.getElementById('root') || document.getElementById('app');
    
    if (!rootElement) {
      throw new Error('Could not find root element with id "root" or "app"');
    }
    
    // Hydrate the application
    hydrate(jsx(PageComponent, { initialState }), rootElement);
    console.log('Hydration complete');
    
    // Add navigation event listeners if using client-side routing
    document.addEventListener('click', handleLinkClicks);
    window.addEventListener('popstate', handleRouteChange);
    
    return true;
  } catch (error) {
    console.error('Error during hydration:', error);
    return false;
  }
}

// Handle client-side navigation for links
function handleLinkClicks(event) {
  // Only handle links within our app
  if (event.target.tagName === 'A' && 
      event.target.origin === window.location.origin && 
      !event.target.hasAttribute('external')) {
    
    event.preventDefault();
    const href = event.target.getAttribute('href');
    
    // Update history and load the new component
    window.history.pushState({}, '', href);
    handleRouteChange();
  }
}

// Handle route changes (back/forward navigation or pushState)
function handleRouteChange() {
  // Update the initialState with the new route
  initialState.route = window.location.pathname;
  
  // Load and hydrate the new component
  loadAndHydrateComponent().catch(err => {
    console.error('Failed to load component after route change:', err);
  });
}

// Wait for DOM to be ready before hydrating
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAndHydrateComponent);
} else {
  loadAndHydrateComponent();
}
