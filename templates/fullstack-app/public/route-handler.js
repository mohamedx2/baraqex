// This file handles client-side routing in development and production

// Ensures our SPA routes work with direct URL access
(function() {
  // Function to get the current route
  function getCurrentRoute() {
    // Check if we have a route from the server
    if (window.__INITIAL_STATE__ && window.__INITIAL_STATE__.route) {
      return window.__INITIAL_STATE__.route;
    }
    
    // Check if we have a route from Vite dev server
    if (window.__INITIAL_ROUTE__) {
      return window.__INITIAL_ROUTE__;
    }
    
    // Use the current pathname
    return window.location.pathname;
  }
  
  // Function to normalize the route for import paths
  function normalizeRoute(route) {
    // Default to index for root path
    if (route === '/') return '/index';
    return route;
  }
  
  // Store the route information globally
  window.__ROUTE_INFO__ = {
    current: getCurrentRoute(),
    normalized: normalizeRoute(getCurrentRoute())
  };
  
  // Clean up URL if needed (remove any _path parameter)
  const url = new URL(window.location.href);
  if (url.searchParams.has('_path')) {
    const path = url.searchParams.get('_path');
    url.searchParams.delete('_path');
    
    // Only replace state if we're not already at the correct path
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path + url.search + url.hash);
    }
  }
  
  console.log('Route handler initialized:', window.__ROUTE_INFO__);
})();
