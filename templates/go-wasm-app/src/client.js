import { hydrate } from 'frontend-hamroun';
import App from './App.jsx';

// Get initial state from server
const initialState = window.__INITIAL_STATE__ || {
  path: window.location.pathname,
  ssrRendered: false,
  wasmAvailable: false
};

// Simple client-side script for hydration
console.log('Client-side script loaded');
console.log('Initial state:', window.__INITIAL_STATE__);

// Wait for DOMContentLoaded to ensure the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Hydrate the application
  hydrate(<App initialState={initialState} />, document.getElementById('root'));
  console.log('Client-side hydration complete');

  if (window.__INITIAL_STATE__) {
    console.log('Hydrating with initial state:', window.__INITIAL_STATE__);
    
    // For now, we'll just display a message that we've loaded on the client
    const root = document.getElementById('root');
    
    // Add a "Client Hydrated" indicator
    const clientIndicator = document.createElement('div');
    clientIndicator.className = 'client-indicator';
    clientIndicator.textContent = 'Client-Side Hydration Active';
    clientIndicator.style.backgroundColor = '#4caf50';
    clientIndicator.style.color = 'white';
    clientIndicator.style.padding = '10px';
    clientIndicator.style.borderRadius = '4px';
    clientIndicator.style.margin = '10px 0';
    clientIndicator.style.textAlign = 'center';
    
    root.appendChild(clientIndicator);

    // Load WASM if needed
    if (typeof window.Go !== 'undefined') {
      console.log('Go WASM runtime detected, initializing WASM module');
      
      // This will be replaced with proper WASM loading in a future step
      const wasmInfo = document.createElement('div');
      wasmInfo.textContent = 'WASM runtime loaded successfully';
      wasmInfo.style.backgroundColor = '#2196f3';
      wasmInfo.style.color = 'white';
      wasmInfo.style.padding = '10px';
      wasmInfo.style.borderRadius = '4px';
      wasmInfo.style.margin = '10px 0';
      wasmInfo.style.textAlign = 'center';
      
      root.appendChild(wasmInfo);
    }
  }
});
