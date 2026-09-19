import { hydrate, jsx } from 'baraqex';
import { App } from './App';
import './styles.css';

declare global {
  interface Window {
    __INITIAL_STATE__?: any;
  }
}

const initialState = window.__INITIAL_STATE__ || {};
const route = window.location.pathname;

const root = document.getElementById('root');
if (root) {
  hydrate(jsx(App, { route, initialState }), root);
}

// Socket.IO live reload (dev)
const w = window as any;
if (w.io) {
  const socket = w.io();
  socket.on('reload', () => window.location.reload());
}

// Handle back/forward navigation
window.addEventListener('popstate', () => {
  const r = document.getElementById('root');
  if (r) hydrate(jsx(App, { route: window.location.pathname, initialState }), r);
});

