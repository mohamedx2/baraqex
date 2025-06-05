import { jsx, render } from 'frontend-hamroun';
import App from './App.tsx';

// Simple render without infinite loops
function startApp() {
  const appElement = jsx(App, {});
  const rootElement = document.getElementById('app');
  
  if (rootElement) {
    render(appElement, rootElement);
  } else {
    console.error('Root element not found');
  }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
