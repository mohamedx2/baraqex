// Simple client-side script for Baraqex fullstack app (no ES6 imports)

console.log('🚀 Baraqex client-side script loaded');

// Add interactive functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('📱 Client-side hydration starting...');
  
  // Add smooth scrolling to anchor links
  const anchors = document.querySelectorAll('a[href^="#"]');
  anchors.forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
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
  forms.forEach(function(form) {
    form.addEventListener('submit', function(e) {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn && !submitBtn.disabled) {
        // Add loading state
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Loading...';
        
        // Reset button after a delay if form doesn't handle it
        setTimeout(function() {
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
  refreshButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      window.location.reload();
    });
  });
  
  console.log('✅ Client-side hydration complete');
});

// Global error handler
window.addEventListener('error', function(e) {
  console.error('🚨 Client error:', e.error);
});

// Handle API requests with better error handling
window.apiRequest = async function(url, options) {
  options = options || {};
  
  try {
    const token = localStorage.getItem('token');
    const headers = Object.assign({
      'Content-Type': 'application/json'
    }, options.headers || {});
    
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }
    
    const response = await fetch(url, Object.assign({}, options, {
      headers: headers
    }));
    
    if (!response.ok) {
      throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};
