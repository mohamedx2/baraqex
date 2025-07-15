
import { loadGoWasm, callWasmFunction,useState, useEffect } from 'baraqex';

export default function App() {
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmError, setWasmError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [inputA, setInputA] = useState(10);
  const [inputB, setInputB] = useState(20);
  const [fibInput, setFibInput] = useState(10);
  const [primeInput, setPrimeInput] = useState(17);
  const [name, setName] = useState('World');

  useEffect(() => {
    let mounted = true;
    
    async function loadWasm() {
      try {
        console.log('Loading Go WASM module using baraqex API...');
        
        // Use baraqex API to load WASM
        await loadGoWasm('/example.wasm', {
          debug: true,
          onLoad: () => {
            console.log('WASM module loaded successfully via baraqex');
          }
        });
        
        if (mounted) {
          setWasmReady(true);
          setWasmError(null);
          console.log('WASM module ready');
        }
      } catch (error) {
        console.error('WASM loading error:', error);
        if (mounted) {
          setWasmError(error instanceof Error ? error.message : 'Unknown WASM loading error');
        }
      }
    }

    loadWasm();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Use baraqex callWasmFunction API
  const callFunction = (funcName: string, ...args: any[]) => {
    try {
      // Call using baraqex API
      return callWasmFunction(funcName, ...args);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Function call failed';
      setWasmError(errorMsg);
      return null;
    }
  };

  const handleHello = () => {
    const greeting = callFunction('goHello', name);
    if (greeting !== null) {
      setResult({ type: 'hello', value: greeting, input: name });
      setWasmError(null);
    }
  };

  const handleAddition = () => {
    const sum = callFunction('goAdd', inputA, inputB);
    if (sum !== null) {
      setResult({ type: 'addition', value: sum, inputs: [inputA, inputB] });
      setWasmError(null);
    }
  };

  const handleMultiplication = () => {
    const product = callFunction('goMultiply', inputA, inputB);
    if (product !== null) {
      setResult({ type: 'multiplication', value: product, inputs: [inputA, inputB] });
      setWasmError(null);
    }
  };

  const handleFibonacci = () => {
    if (fibInput > 40) {
      setWasmError('Fibonacci input too large (max 40)');
      return;
    }
    const fibResult = callFunction('goFibonacci', fibInput);
    if (fibResult !== null) {
      setResult({ type: 'fibonacci', value: fibResult, input: fibInput });
      setWasmError(null);
    }
  };

  const handlePrimeCheck = () => {
    const isPrime = callFunction('goIsPrime', primeInput);
    if (isPrime !== null) {
      setResult({ type: 'prime', value: isPrime, input: primeInput });
      setWasmError(null);
    }
  };

  if (!wasmReady && !wasmError) {
    return (
      <div className="app loading">
        <div className="spinner"></div>
        <h2>Loading Go WASM Module...</h2>
        <p>Initializing WebAssembly runtime...</p>
      </div>
    );
  }

  if (wasmError) {
    return (
      <div className="app error">
        <h2>WASM Error</h2>
        <p>{wasmError}</p>
        <button onClick={() => window.location.reload()}>Reload Page</button>
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary>Troubleshooting</summary>
          <ul>
            <li>Make sure the WASM file is built: <code>npm run build:wasm</code></li>
            <li>Check if <code>example.wasm</code> exists in the public folder</li>
            <li>Verify <code>wasm_exec.js</code> is loaded in the HTML</li>
            <li>Check browser console for additional errors</li>
          </ul>
        </details>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>Frontend Hamroun + Go WASM (Baraqex)</h1>
        <p>High-performance computing with WebAssembly via Baraqex API</p>
        <div className="status">
          <span className="status-indicator ready"></span>
          WASM Ready via Baraqex
        </div>
      </header>

      <main>
        <section className="demo-grid">
          {/* Hello Function */}
          <div className="demo-card">
            <h3>🌍 Hello Function</h3>
            <div className="input-group">
              <input 
                type="text" 
                value={name} 
                onChange={(e: { target: { value: string | ((prev: string) => string); }; }) => setName(e.target.value)}
                placeholder="Enter your name"
              />
              <button onClick={handleHello}>Say Hello</button>
            </div>
            <small>callWasmFunction('goHello', '{name}')</small>
          </div>

          {/* Math Operations */}
          <div className="demo-card">
            <h3>🧮 Math Operations</h3>
            <div className="input-group">
              <input 
                type="number" 
                value={inputA} 
                onChange={(e: { target: { value: any; }; }) => setInputA(Number(e.target.value))}
                placeholder="First number"
              />
              <input 
                type="number" 
                value={inputB} 
                onChange={(e: { target: { value: any; }; }) => setInputB(Number(e.target.value))}
                placeholder="Second number"
              />
            </div>
            <div className="button-group">
              <button onClick={handleAddition}>Add</button>
              <button onClick={handleMultiplication}>Multiply</button>
            </div>
            <small>callWasmFunction('goAdd', {inputA}, {inputB})</small>
          </div>

          {/* Fibonacci */}
          <div className="demo-card">
            <h3>🔢 Fibonacci Sequence</h3>
            <div className="input-group">
              <input 
                type="number" 
                value={fibInput} 
                onChange={(e: { target: { value: any; }; }) => setFibInput(Number(e.target.value))}
                placeholder="Fibonacci number"
                min="0"
                max="40"
              />
              <button onClick={handleFibonacci}>Calculate</button>
            </div>
            <small>Maximum value: 40</small>
          </div>

          {/* Prime Check */}
          <div className="demo-card">
            <h3>🔍 Prime Number Check</h3>
            <div className="input-group">
              <input 
                type="number" 
                value={primeInput} 
                onChange={(e: { target: { value: any; }; }) => setPrimeInput(Number(e.target.value))}
                placeholder="Number to check"
                min="1"
              />
              <button onClick={handlePrimeCheck}>Check Prime</button>
            </div>
          </div>
        </section>

        {/* Results Display */}
        {result && (
          <section className="results">
            <h2>📊 Baraqex WASM Result</h2>
            <div className="result-card">
              {result.type === 'hello' && (
                <p><strong>Greeting:</strong> <span className="result-value">{result.value}</span></p>
              )}
              {result.type === 'addition' && (
                <p><strong>Addition:</strong> {result.inputs[0]} + {result.inputs[1]} = <span className="result-value">{result.value}</span></p>
              )}
              {result.type === 'multiplication' && (
                <p><strong>Multiplication:</strong> {result.inputs[0]} × {result.inputs[1]} = <span className="result-value">{result.value}</span></p>
              )}
              {result.type === 'fibonacci' && (
                <p><strong>Fibonacci:</strong> F({result.input}) = <span className="result-value">{result.value}</span></p>
              )}
              {result.type === 'prime' && (
                <p><strong>Prime Check:</strong> {result.input} is <span className="result-value">{result.value ? 'prime' : 'not prime'}</span></p>
              )}
            </div>
          </section>
        )}

        {/* Info Section */}
        <section className="info-section">
          <h2>⚡ Baraqex WASM Benefits</h2>
          <div className="benefits-grid">
            <div className="benefit">
              <h4>🚀 Simple API</h4>
              <p>Easy-to-use loadGoWasm() and callWasmFunction() API</p>
            </div>
            <div className="benefit">
              <h4>🔄 Cross-Platform</h4>
              <p>Works in browser and Node.js with same API</p>
            </div>
            <div className="benefit">
              <h4>🛠️ Go Integration</h4>
              <p>Seamless Go + JavaScript interoperability</p>
            </div>
            <div className="benefit">
              <h4>📊 Debug Support</h4>
              <p>Built-in debugging and function discovery</p>
            </div>
          </div>
        </section>
      </main>

      <style>{`
        .app {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
        }
        
        .app.loading, .app.error {
          text-align: center;
          padding: 60px 20px;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #007acc;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        header {
          text-align: center;
          margin-bottom: 40px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px;
          position: relative;
        }
        
        header h1 {
          margin: 0 0 10px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }
        
        header p {
          margin: 0 0 20px 0;
          opacity: 0.9;
          font-size: 1.1rem;
        }
        
        .status {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
        }
        
        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ade80;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .demo-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .demo-card {
          background: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .demo-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
        
        .demo-card h3 {
          margin-top: 0;
          margin-bottom: 16px;
          color: #374151;
          font-size: 1.2rem;
        }
        
        .input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        
        .button-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        input {
          flex: 1;
          min-width: 120px;
          padding: 10px 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        
        input:focus {
          outline: none;
          border-color: #007acc;
        }
        
        button {
          background: #007acc;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          white-space: nowrap;
        }
        
        button:hover {
          background: #0056a3;
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
        
        small {
          color: #6b7280;
          font-size: 0.8rem;
        }
        
        .results {
          background: #f0f9ff;
          padding: 24px;
          border-radius: 12px;
          border: 2px solid #bae6fd;
          margin: 30px 0;
        }
        
        .results h2 {
          margin-top: 0;
          color: #0369a1;
        }
        
        .result-card {
          background: white;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #bae6fd;
        }
        
        .result-value {
          font-weight: bold;
          color: #007acc;
          background: #e0f2fe;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .info-section {
          margin-top: 40px;
        }
        
        .info-section h2 {
          text-align: center;
          margin-bottom: 30px;
          color: #374151;
        }
        
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .benefit {
          background: #f9fafb;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          text-align: center;
        }
        
        .benefit h4 {
          margin: 0 0 8px 0;
          color: #374151;
          font-size: 1.1rem;
        }
        
        .benefit p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }
        
        .error {
          color: #dc2626;
        }
        
        .error button {
          background: #dc2626;
          margin-top: 20px;
        }
        
        .error button:hover {
          background: #b91c1c;
        }
        
        details {
          background: #fef2f2;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #fecaca;
        }
        
        summary {
          cursor: pointer;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        code {
          background: #f3f4f6;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
          .app {
            padding: 10px;
          }
          
          header {
            padding: 20px;
          }
          
          header h1 {
            font-size: 2rem;
          }
          
          .demo-grid {
            grid-template-columns: 1fr;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          input {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
}
