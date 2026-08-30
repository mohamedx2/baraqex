import { jsx, useState, useEffect, useMemo } from 'frontend-hamroun';

// Define our state types for better type safety
interface CounterState {
  count: number;
  lastUpdated: string | null;
  history: number[];
}

export default function StateDemo() {
  // More comprehensive state with history tracking
  const [state, setState] = useState<CounterState>({
    count: 0,
    lastUpdated: null,
    history: []
  });
  
  // Track UI state separately
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Check for server-side rendering
  const isSSR = typeof window === 'undefined';
  
  // Calculate derived state with useMemo for performance
  const stats = useMemo(() => {
    // Ensure we have a valid history array
    if (isSSR || !state || !state.history || state.history.length === 0) {
      return { avg: 0, max: 0, min: 0 };
    }
    
    try {
      const sum = state.history.reduce((a, b) => a + b, 0);
      return {
        avg: parseFloat((sum / state.history.length).toFixed(1)),
        max: Math.max(...state.history),
        min: Math.min(...state.history)
      };
    } catch (error) {
      console.error('Error calculating stats:', error);
      return { avg: 0, max: 0, min: 0 };
    }
  }, [state?.history]);
  
  // Handle increment with history tracking
  const increment = () => {
    if (isSSR) return;
    
    setIsLoading(true);
    
    // Simulate async operation
    setTimeout(() => {
      setState(prevState => ({
        count: prevState.count + 1,
        lastUpdated: new Date().toLocaleTimeString(),
        history: [...(prevState.history || []), prevState.count + 1]
      }));
      setIsLoading(false);
    }, 300);
  };
  
  // Handle decrement with bounds checking
  const decrement = () => {
    if (isSSR) return;
    
    setIsLoading(true);
    
    // Simulate async operation
    setTimeout(() => {
      setState(prevState => ({
        count: Math.max(0, prevState.count - 1),
        lastUpdated: new Date().toLocaleTimeString(),
        history: prevState.count > 0 ? [...(prevState.history || []), prevState.count - 1] : (prevState.history || [])
      }));
      setIsLoading(false);
    }, 300);
  };
  
  // Reset counter
  const reset = () => {
    if (isSSR) return;
    
    setState({
      count: 0,
      lastUpdated: new Date().toLocaleTimeString(),
      history: []
    });
  };
  
  // Toggle history visibility
  const toggleHistory = () => {
    if (isSSR) return;
    
    setShowHistory(prev => !prev);
  };
  
  // For SSR, return a simpler version of the component
  if (isSSR) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          State Management Demo
        </h2>
        <div className="flex items-center justify-between mb-4">
          <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">-</button>
          <span className="text-2xl font-bold mx-4">0</span>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">+</button>
        </div>
        <p className="text-sm text-gray-500">Interactive counter (client-side only)</p>
      </div>
    );
  }
  
  // Regular client-side render
  return (
    <div className="bg-white shadow-lg rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        State Management Demo
      </h2>
      
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={decrement}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            disabled={state.count === 0 || isLoading}
          >
            {isLoading ? '...' : '-'}
          </button>
          
          <span className="text-2xl font-bold mx-4">{state.count}</span>
          
          <button 
            onClick={increment}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? '...' : '+'}
          </button>
        </div>
        
        <button
          onClick={reset}
          className="text-sm text-gray-600 hover:text-red-600"
          disabled={state.count === 0 && (!state.history || state.history.length === 0)}
        >
          Reset Counter
        </button>
      </div>
      
      {state.lastUpdated && (
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Last updated: {state.lastUpdated}
          </p>
        </div>
      )}
      
      {state.history && state.history.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-md font-medium text-gray-700">Statistics</h3>
            <button
              onClick={toggleHistory}
              className="text-sm text-blue-600 hover:underline"
            >
              {showHistory ? 'Hide History' : 'Show History'}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-blue-50 p-2 rounded text-center">
              <div className="text-xs text-gray-500">Average</div>
              <div className="font-bold">{stats.avg}</div>
            </div>
            <div className="bg-green-50 p-2 rounded text-center">
              <div className="text-xs text-gray-500">Maximum</div>
              <div className="font-bold">{stats.max}</div>
            </div>
            <div className="bg-red-50 p-2 rounded text-center">
              <div className="text-xs text-gray-500">Minimum</div>
              <div className="font-bold">{stats.min}</div>
            </div>
          </div>
          
          {showHistory && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                History ({state.history.length} events)
              </h4>
              <div className="bg-gray-50 p-2 rounded max-h-24 overflow-y-auto text-xs">
                {state.history.map((value, index) => (
                  <span 
                    key={index} 
                    className="inline-block bg-gray-200 rounded px-2 py-1 m-1"
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
