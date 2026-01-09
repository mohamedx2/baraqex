/**
 * Basic Baraqex Example
 * 
 * A simple counter application demonstrating:
 * - JSX syntax
 * - useState hook
 * - Event handling
 * - Component composition
 */

import { jsx, useState, render } from 'baraqex';

// Counter component with state
function Counter() {
  const [count, setCount] = useState(0);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(0);

  return (
    <div className="counter">
      <h1>🔢 Counter: {count}</h1>
      <div className="buttons">
        <button onClick={decrement} disabled={count <= 0}>
          ➖ Decrease
        </button>
        <button onClick={reset}>
          🔄 Reset
        </button>
        <button onClick={increment}>
          ➕ Increase
        </button>
      </div>
    </div>
  );
}

// Greeting component
function Greeting({ name }) {
  return (
    <div className="greeting">
      <h2>👋 Welcome to Baraqex, {name}!</h2>
      <p>Start building amazing apps with WASM superpowers.</p>
    </div>
  );
}

// Main App component
function App() {
  return (
    <div className="app">
      <header>
        <h1>⚡ Baraqex Basic Example</h1>
      </header>
      <main>
        <Greeting name="Developer" />
        <Counter />
      </main>
      <footer>
        <p>
          Built with <a href="https://baraqex.tech">Baraqex</a>
        </p>
      </footer>
    </div>
  );
}

// Mount the app
render(<App />, document.getElementById('root'));
