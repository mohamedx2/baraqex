import { jsx, useState, useEffect } from 'baraqex';

export default function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Welcome to Baraqex!');

  useEffect(() => {
    console.log('App component mounted');
  }, []);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  const decrement = () => {
    setCount(prev => prev - 1);
  };

  const resetCount = () => {
    setCount(0);
    setMessage('Counter reset!');
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>{message}</h1>
        <p>This is a basic Baraqex application template.</p>
      </header>
      
      <main className="app-main">
        <div className="counter-section">
          <h2>Interactive Counter</h2>
          <div className="counter-display">
            <span className="count-value">{count}</span>
          </div>
          
          <div className="counter-controls">
            <button onClick={decrement} className="btn btn-secondary">
              - Decrease
            </button>
            <button onClick={increment} className="btn btn-primary">
              + Increase
            </button>
            <button onClick={resetCount} className="btn btn-danger">
              Reset
            </button>
          </div>
        </div>
        
        <div className="info-section">
          <h3>Features Included:</h3>
          <ul>
            <li>✅ Modern JSX components</li>
            <li>✅ State management with hooks</li>
            <li>✅ Event handling</li>
            <li>✅ Component lifecycle</li>
            <li>✅ Responsive design</li>
          </ul>
        </div>
      </main>
      
      <footer className="app-footer">
        <p>Built with ❤️ using Baraqex Framework</p>
      </footer>
    </div>
  );
}
