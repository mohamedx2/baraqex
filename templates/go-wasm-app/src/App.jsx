import { jsx } from 'frontend-hamroun';
import WasmDemo from './components/WasmDemo';
import Header from './components/Header';
import Footer from './components/Footer';

// Simple App component - will be used with proper rendering in a future step
export default function App({ initialState = {} }) {
  return (
    <div className="app">
      <header>
        <h1>Frontend Hamroun + Go WebAssembly</h1>
        <p>A powerful combination for high-performance web applications</p>
      </header>
      
      <main>
        <div className="card">
          <h2>Server-Side Rendered Content</h2>
          <p>This content was rendered on the server and hydrated on the client.</p>
          <p>Path: {initialState.path || 'Unknown'}</p>
          <p>WASM Available: {initialState.wasmAvailable ? 'Yes' : 'No'}</p>
        </div>
        
        {initialState.processedData && (
          <div className="card">
            <h2>Server-Processed Data</h2>
            <pre>{JSON.stringify(initialState.processedData, null, 2)}</pre>
          </div>
        )}
      </main>
      
      <footer>
        <p>
          Built with Frontend Hamroun and Go WebAssembly
        </p>
      </footer>
    </div>
  );
}
