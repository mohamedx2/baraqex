import { jsx } from 'frontend-hamroun';

export default function NotFound({ initialState }) {
  return (
    <div className="not-found-container max-w-4xl mx-auto p-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-700 mb-4">Page Not Found</h1>
        
        <p className="text-lg text-gray-600 mb-4">
          The page you are looking for does not exist or has been moved.
        </p>
        
        <p className="text-gray-600 mb-6">
          Path: <code className="bg-gray-100 px-2 py-1 rounded">{initialState?.route || 'unknown'}</code>
        </p>
        
        <div className="mt-6">
          <a 
            href="/"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
