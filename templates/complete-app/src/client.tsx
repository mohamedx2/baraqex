import { hydrate, createElement } from 'frontend-hamroun';

// For simplicity in this example, we just hydrate the root component
// In a more complex app, you might use a router
import HomePage from './pages/index';

// When the DOM is ready, hydrate the server-rendered HTML
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('app');
  
  if (rootElement) {
    // Hydrate the app with the same component that was rendered on the server
    hydrate(<HomePage />, rootElement);
    console.log('Hydration complete');
  } else {
    console.error('Could not find root element with id "app"');
  }
});
