import { hydrate, jsx } from 'frontend-hamroun';

// Dynamically import the appropriate page component
async function hydratePage() {
  try {
    // Get initial state from server
    const initialState = window.__INITIAL_STATE__ || {};
    
    // Get current path
    const path = initialState.route || window.location.pathname;
    const normalizedPath = path === '/' ? '/index' : path;
    
    // Create path to module
    const modulePath = `.${normalizedPath.replace(/\/$/, '')}.js`;
    
    try {
      // Dynamically import the component
      const module = await import(`./pages${normalizedPath}.js`).catch(() => 
        import(`./pages${normalizedPath}/index.js`));
      
      const PageComponent = module.default;
      
      // Find the root element
      const rootElement = document.getElementById('root');
      
      if (rootElement && PageComponent) {
        // Hydrate the application with the same params from the server
        hydrate(jsx(PageComponent, { params: initialState.params || {} }), rootElement);
        console.log('Hydration complete');
      } else {
        console.error('Could not find root element or page component');
      }
    } catch (importError) {
      console.error('Error importing page component:', importError);
      
      // Fallback to App component if available
      try {
        const { App } = await import('./App.js');
        const rootElement = document.getElementById('root');
        
        if (rootElement && App) {
          hydrate(jsx(App, {}), rootElement);
          console.log('Fallback hydration complete');
        }
      } catch (fallbackError) {
        console.error('Fallback hydration failed:', fallbackError);
      }
    }
  } catch (error) {
    console.error('Hydration error:', error);
  }
}

// Add global variable for JSX
window.jsx = jsx;

// Hydrate when DOM is ready
document.addEventListener('DOMContentLoaded', hydratePage);

// Handle client-side navigation (if implemented)
window.addEventListener('popstate', hydratePage);
