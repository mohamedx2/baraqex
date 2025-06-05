// Simple client-side hydration script for Baraqex fullstack app

console.log('🚀 Baraqex client-side script loaded');

// Add interactive functionality
document.addEventListener('DOMContentLoaded', () => {
  console.log('📱 Client-side hydration starting...');
  
  // Add smooth scrolling to anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  
  // Add form enhancements
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        // Add loading state
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        
        // Reset button after a delay if form doesn't handle it
        setTimeout(() => {
          if (submitBtn.disabled) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
          }
        }, 5000);
      }
    });
  });
  
  // Add click handlers for refresh buttons
  const refreshButtons = document.querySelectorAll('[data-refresh]');
  refreshButtons.forEach(button => {
    button.addEventListener('click', () => {
      window.location.reload();
    });
  });
  
  // Initialize users API demo if present
  if (typeof fetchUsers === 'function') {
    fetchUsers();
  }
  
  console.log('✅ Client-side hydration complete');
});

// Global error handler
window.addEventListener('error', (e) => {
  console.error('🚨 Client error:', e.error);
});

// Handle API requests with better error handling
window.apiRequest = async (url, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Global fetchUsers function for the demo
window.fetchUsers = async function() {
  const container = document.getElementById('users-grid');
  if (!container) return;
  
  container.innerHTML = '<div class="loading">Loading users...</div>';
  
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await response.json();
    const users = data.data.users || [];
    
    if (users.length > 0) {
      container.innerHTML = users.map(user => `
        <div class="user-card">
          <h5>${user.name}</h5>
          <p>${user.email}</p>
          <span class="role ${user.role}">${user.role}</span>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="no-users">No users found</div>';
    }
  } catch (error) {
    container.innerHTML = `<div class="error-message">❌ Error: ${error.message}</div>`;
  }
};

// Auto-generated hydration script
          import { hydrate } from 'frontend-hamroun';
          
          // Find SSR content and hydrate it
          document.addEventListener('DOMContentLoaded', () => {
            const ssrRoots = document.querySelectorAll('[data-ssr-root]');
            ssrRoots.forEach(root => {
              const componentPath = root.getAttribute('data-component');
              if (componentPath) {
                import(componentPath).then(module => {
                  hydrate(module.default, root);
                });
              }
            });
          });
