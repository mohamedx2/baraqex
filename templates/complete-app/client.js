import { hydrate, jsx } from 'frontend-hamroun';

// Create a sample virtual DOM matching what was rendered on the server
const app = {
  type: 'div',
  props: {
    id: 'app',
    children: [
      {
        type: 'h1',
        props: {
          children: 'Hello from Server-Side Rendering!'
        }
      },
      {
        type: 'p',
        props: {
          children: `This page was rendered at ${new Date().toISOString()}`
        }
      },
      {
        type: 'button',
        props: {
          id: 'counter-btn',
          className: 'btn',
          onClick: () => {
            let count = 1; // Start at 1 since we're updating
            const btn = document.getElementById('counter-btn');
            if (btn) {
              btn.textContent = `Click me (${count})`;
              btn.addEventListener('click', () => {
                count++;
                btn.textContent = `Click me (${count})`;
              });
            }
          },
          children: 'Click me (0)'
        }
      }
    ]
  }
};

// Wait for DOM to be fully loaded before hydrating
window.addEventListener('DOMContentLoaded', () => {
  console.log('Hydrating client-side content...');
  
  // Get the container element
  const container = document.getElementById('app');
  if (!container) {
    console.error('Could not find app container for hydration');
    return;
  }
  
  // Hydrate the app
  hydrate(app, container);
  console.log('Hydration complete!');
});
