import { jsx, useState, useEffect, useErrorBoundary } from 'frontend-hamroun';

interface ErrorBoundaryProps {
  children: any;
  fallback?: (error: Error, reset: () => void) => any;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, resetError] = useErrorBoundary();
  
  if (error) {
    if (fallback) {
      return fallback(error, resetError);
    }
    
    return (
      <div className="error-boundary p-4 border border-red-500 rounded bg-red-50">
        <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
        <p className="text-red-600 mb-2">{error.message}</p>
        <button
          onClick={resetError}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
        {process.env.NODE_ENV !== 'production' && (
          <pre className="mt-3 text-xs overflow-auto p-2 bg-gray-100">
            {error.stack}
          </pre>
        )}
      </div>
    );
  }
  
  return children;
}
