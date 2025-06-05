import { jsx, useState } from 'frontend-hamroun';

export default function HomePage(props) {
  const [count, setCount] = useState(0);
  
  return jsx('div', { 
    style: { 
      padding: '2rem', 
      textAlign: 'center', 
      fontFamily: 'system-ui',
      maxWidth: '800px',
      margin: '0 auto'
    } 
  },
    jsx('h1', { 
      style: { 
        color: '#2c3e50',
        marginBottom: '1rem',
        fontSize: '2.5rem'
      } 
    }, 'Welcome to Your Baraqex Full-Stack App! 🚀'),
    
    jsx('div', { 
      style: { 
        background: '#f8f9fa',
        padding: '2rem',
        borderRadius: '12px',
        margin: '2rem 0',
        border: '1px solid #dee2e6'
      } 
    },
      jsx('p', { 
        style: { 
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#495057',
          margin: '0 0 1rem 0'
        } 
      }, `Counter: ${count}`),
      
      jsx('div', { style: { margin: '1rem 0' } },
        jsx('button', { 
          onclick: () => setCount(count + 1),
          style: { 
            padding: '0.75rem 1.5rem', 
            margin: '0.5rem',
            background: '#007acc',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }
        }, 'Increment'),
        jsx('button', { 
          onclick: () => setCount(count - 1),
          style: { 
            padding: '0.75rem 1.5rem', 
            margin: '0.5rem',
            background: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }
        }, 'Decrement'),
        jsx('button', { 
          onclick: () => setCount(0),
          style: { 
            padding: '0.75rem 1.5rem', 
            margin: '0.5rem',
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }
        }, 'Reset')
      )
    ),
    
    jsx('div', { 
      style: { 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#e8f5e8', 
        borderRadius: '8px',
        border: '1px solid #c3e6c3'
      } 
    },
      jsx('h3', { 
        style: { 
          margin: '0 0 1rem 0',
          color: '#155724'
        } 
      }, '🎯 Features Included:'),
      jsx('ul', { 
        style: { 
          textAlign: 'left', 
          maxWidth: '500px', 
          margin: '0 auto',
          listStyle: 'none',
          padding: 0
        } 
      },
        jsx('li', { 
          style: { 
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          } 
        }, '✅ Server-side rendering with ESBuild'),
        jsx('li', { 
          style: { 
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          } 
        }, '✅ API routes in src/api/'),
        jsx('li', { 
          style: { 
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          } 
        }, '✅ Page-based routing'),
        jsx('li', { 
          style: { 
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(0,0,0,0.1)'
          } 
        }, '✅ Client-side hydration'),
        jsx('li', { 
          style: { 
            padding: '0.5rem 0'
          } 
        }, '✅ Frontend Hamroun hooks')
      )
    ),
    
    jsx('div', {
      style: {
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffeaa7'
      }
    },
      jsx('h3', {
        style: {
          margin: '0 0 1rem 0',
          color: '#856404'
        }
      }, '🔗 Quick Links:'),
      jsx('div', {
        style: {
          display: 'flex',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }
      },
        jsx('a', {
          href: '/api/hello',
          style: {
            padding: '0.5rem 1rem',
            background: '#17a2b8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }
        }, 'API Hello'),
        jsx('a', {
          href: '/api-docs',
          style: {
            padding: '0.5rem 1rem',
            background: '#6f42c1',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.9rem'
          }
        }, 'API Docs')
      )
    ),
    
    jsx('p', { 
      style: { 
        marginTop: '2rem', 
        color: '#6c757d',
        fontSize: '0.9rem'
      } 
    }, 'Edit src/pages/index.js to customize this page')
  );
}

// Optional: Add metadata for SEO
HomePage.title = 'Baraqex Full-Stack App';
HomePage.description = 'A complete full-stack application built with Baraqex framework';
