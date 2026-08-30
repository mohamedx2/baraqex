import { hydrate } from 'frontend-hamroun';
import App from './App';

// Get initial state from server
const initialState = window.__INITIAL_STATE__ || {
  path: window.location.pathname,
  ssrRendered: false,
  wasmAvailable: false
};

// Hydrate the application
hydrate(<App initialState={initialState} />, document.getElementById('root'));
