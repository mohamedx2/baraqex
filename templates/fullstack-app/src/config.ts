// Application configuration
// Modify this file to customize your application without changing core files

export const AppConfig = {
  // App information
  title: 'Frontend Hamroun App',
  description: 'A full-stack application built with Frontend Hamroun',
  
  // Navigation
  navigation: [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/users', label: 'Users' }
  ],
  
  // API endpoints
  api: {
    baseUrl: '/api',
    endpoints: {
      users: '/users',
      posts: '/posts'
    }
  },
  
  // Default meta tags
  meta: {
    viewport: 'width=device-width, initial-scale=1.0',
    charset: 'UTF-8',
    author: 'Your Name',
    keywords: 'frontend-hamroun, fullstack, template'
  },
  
  // Style customization
  theme: {
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif'
  }
};

export default AppConfig;
