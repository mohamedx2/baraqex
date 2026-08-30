import { jsx } from 'frontend-hamroun';
import Layout from '../components/Layout';

export default function AboutPage({ initialState }) {
  return (
    <Layout title="About - Frontend Hamroun">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">
          About Frontend Hamroun
        </h1>
        
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What is Frontend Hamroun?</h2>
          <p className="text-gray-600 mb-4">
            Frontend Hamroun is a lightweight JavaScript framework for building modern web applications.
            It provides a familiar component-based architecture with hooks, JSX support, and 
            server-side rendering capabilities.
          </p>
          <p className="text-gray-600 mb-4">
            This framework is designed to be simple yet powerful, offering the essential features
            needed for web application development without the complexity of larger frameworks.
          </p>
          
          <h3 className="text-lg font-medium text-gray-700 mt-6 mb-2">Key Features:</h3>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Component-based architecture</li>
            <li>JSX support</li>
            <li>Hooks for state and effects</li>
            <li>Server-side rendering</li>
            <li>Minimal API surface</li>
            <li>File-based routing</li>
            <li>Built-in API routes</li>
          </ul>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Getting Started</h2>
          <p className="text-gray-600 mb-4">
            This application was created using the Frontend Hamroun fullstack template,
            which provides a complete setup for building applications with server-side rendering,
            API routes, and client-side navigation.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md mt-4">
            <h3 className="text-md font-medium text-gray-700 mb-2">Quick Start:</h3>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto">
              <code>{`# Create a new application
npx frontend-hamroun create my-app

# Change directory
cd my-app

# Start the development server
npm run dev`}</code>
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Server-side data fetching
export async function getServerSideProps() {
  return {
    props: {
      pageTitle: 'About Frontend Hamroun',
      description: 'Learn more about the Frontend Hamroun framework'
    }
  };
}
