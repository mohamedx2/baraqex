import { jsx, useState } from 'frontend-hamroun';

export default function AboutPage(props) {
  const [count, setCount] = useState(0);
  
  return jsx('div', { style: { padding: '2rem', fontFamily: 'Arial, sans-serif' } },
    jsx('h1', { style: { color: '#e74c3c' } }, '📖 About Baraqex'),
    jsx('p', null, 'This is a demonstration of server-side rendering with client-side hydration.'),
    jsx('div', { style: { margin: '2rem 0' } },
      jsx('h3', null, 'Features:'),
      jsx('ul', null,
        jsx('li', null, '✅ Server-side rendering (SSR)'),
        jsx('li', null, '✅ Client-side hydration'),
        jsx('li', null, '✅ File-based routing'),
        jsx('li', null, '✅ API routes'),
        jsx('li', null, '✅ Static file serving'),
        jsx('li', null, '✅ Development server')
      )
    ),
    jsx('div', { style: { background: '#e8f5e8', padding: '1rem', borderRadius: '8px' } },
      jsx('h3', null, 'Interactive Counter:'),
      jsx('p', null, 'Count: ', jsx('strong', null, count)),
      jsx('button', { 
        onClick: () => setCount(count + 1),
        style: { margin: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }
      }, 'Increment'),
      jsx('button', { 
        onClick: () => setCount(count - 1),
        style: { margin: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }
      }, 'Decrement'),
      jsx('button', { 
        onClick: () => setCount(0),
        style: { margin: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer' }
      }, 'Reset')
    ),
    jsx('div', { style: { marginTop: '2rem' } },
      jsx('a', { href: '/', style: { color: '#3498db' } }, '← Back to Home')
    )
  );
}

AboutPage.title = 'About Baraqex';
AboutPage.description = 'Learn about the Baraqex framework features';
