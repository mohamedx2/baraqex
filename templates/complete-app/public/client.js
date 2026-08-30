// Simple client-side hydration script

// Helper to create a jsx element
function jsx(type, props, ...children) {
  props = props || {};
  if (children.length) {
    props.children = children.length === 1 ? children[0] : children;
  }
  return { type, props };
}

// Global Fragment symbol
const Fragment = Symbol.for('react.fragment');

// Basic hydration logic for interactivity
function hydrate(element, container) {
  console.log('Hydrating app...');
  
  // Simple event delegation for the entire app container
  container.addEventListener('click', (event) => {
    const target = event.target;
    
    // Handle button clicks
    if (target.tagName === 'BUTTON') {
      console.log('Button clicked:', target.textContent);
      
      // Add some visual feedback
      const originalColor = target.style.backgroundColor;
      target.style.backgroundColor = '#ccc';
      
      setTimeout(() => {
        target.style.backgroundColor = originalColor;
      }, 200);
    }
    
    // Handle links
    if (target.tagName === 'A' && target.getAttribute('href') && !target.getAttribute('href').startsWith('http')) {
      event.preventDefault();
      const href = target.getAttribute('href');
      console.log('Link clicked:', href);
      
      // Simple client-side navigation simulation
      history.pushState(null, '', href);
      
      // Show a loading message - in a real app, you would fetch the new page
      container.innerHTML = '<div class="container"><h3>Loading...</h3></div>';
      
      // Reload the page after a short delay to demonstrate
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  });
}

// Immediately invoked function to handle hydration
(async function() {
  try {
    // Get the app container
    const appRoot = document.getElementById('app');
    if (!appRoot) {
      console.error('App root element not found');
      return;
    }

    // Get initial data from the server
    let initialData = {};
    try {
      const dataElement = document.getElementById('__APP_DATA__');
      if (dataElement && dataElement.textContent) {
        initialData = JSON.parse(dataElement.textContent);
        console.log('Initial data loaded:', initialData);
      }
    } catch (err) {
      console.error('Error parsing initial data:', err);
    }

    // Make the app interactive
    hydrate({ type: 'div', props: { initialData } }, appRoot);
    
    console.log('App hydrated successfully');
  } catch (err) {
    console.error('Hydration failed:', err);
  }
})();

// Make jsx globally available
window.jsx = jsx;
window.Fragment = Fragment;
