import { jsx, useState, useEffect } from 'frontend-hamroun';

export default function ErrorPage({ initialState }) {
  const { error } = initialState || {};
  const [showDetails, setShowDetails] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';
  
  return (
    <div className="error-page-container max-w-4xl mx-auto p-6">
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-red-700 mb-4">Something went wrong</h1>
        
        <p className="text-lg text-red-600 mb-4">
          {error?.message || "An unexpected error occurred"}
        </p>
        
        {isDev && error?.stack && (
          <div className="mt-6">
            <button
              className="text-blue-600 underline mb-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Hide" : "Show"} technical details
            </button>
            
            {showDetails && (
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-96 text-gray-800">
                {error.stack}
              </pre>
            )}
          </div>
        )}
        
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
