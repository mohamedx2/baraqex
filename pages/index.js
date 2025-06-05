import { jsx } from 'frontend-hamroun';

export default function HomePage(props) {
  return jsx('div', { style: { padding: '2rem', fontFamily: 'Arial, sans-serif' } },
    jsx('h1', { style: { color: '#2c3e50' } }, '🚀 Baraqex Dev Server'),
    jsx('p', null, 'Welcome to your Baraqex development environment!'),
    jsx('div', { style: { margin: '2rem 0' } },
      jsx('h3', null, 'Server Information:'),
      jsx('ul', null,
        jsx('li', null, 'Server Time: ', props.api.serverTime),
        jsx('li', null, 'Path: ', props.path),
        jsx('li', null, 'Framework: Frontend Hamroun + Baraqex')
      )
    ),
    jsx('div', { style: { background: '#ecf0f1', padding: '1rem', borderRadius: '8px' } },
      jsx('h3', null, 'Quick Start:'),
      jsx('ol', null,
        jsx('li', null, 'Create pages in ./pages/ directory'),
        jsx('li', null, 'Add API routes in ./src/api/ directory'),
        jsx('li', null, 'Static files go in ./public/ directory'),
        jsx('li', null, 'Visit /dev-info for development information')
      )
    )
  );
}

// Optional: Add metadata
HomePage.title = 'Baraqex Dev Server';
HomePage.description = 'Development server for Baraqex framework';
