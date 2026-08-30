import { useState, useEffect } from 'frontend-hamroun';

// This component will be rendered on both server and client
export default function HomePage() {
  const [count, setCount] = useState(0);
  const [serverTime, setServerTime] = useState('');

  // This effect only runs on the client after hydration
  useEffect(() => {
    // Set server render time (only when hydrating)
    if (!serverTime) {
      setServerTime('Client-side hydration complete');
    }
    
    // Simple cleanup function
    return () => {
      console.log('Component unmounting');
    };
  }, []);

  return (
    <div id="app">
      <div className="hero min-h-screen bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">Frontend Hamroun SSR</h1>
            <p className="py-6">
              This page was rendered on the server and hydrated on the client.
            </p>
            
            {/* Interactive counter demonstrates client-side hydration */}
            <div className="my-4 p-4 bg-base-300 rounded-lg">
              <p>Counter: {count}</p>
              <button 
                className="btn btn-primary mt-2"
                onClick={() => setCount(count + 1)}
              >
                Increment
              </button>
            </div>
            
            {/* Shows server render time or hydration status */}
            <div className="text-sm opacity-70 mt-4">
              {serverTime ? serverTime : `Server rendered at: ${new Date().toISOString()}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
