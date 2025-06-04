import { jsx, useState, useEffect } from 'baraqex';
import { loadGoWasm, callWasmFunction, isWasmReady } from 'baraqex';

export default function WasmApp() {
  const [wasmReady, setWasmReady] = useState(false);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    initializeWasm();
  }, []);

  const initializeWasm = async () => {
    try {
      setLoading(true);
      await loadGoWasm('/app.wasm', { debug: true });
      setWasmReady(isWasmReady());
    } catch (error) {
      console.error('Failed to load WASM:', error);
    } finally {
      setLoading(false);
    }
  };

  const runFactorial = () => {
    if (!wasmReady) return;
    const result = callWasmFunction('goFactorial', 10);
    setResults(prev => ({ ...prev, factorial: result }));
  };

  const runMatrixMultiply = () => {
    if (!wasmReady) return;
    const result = callWasmFunction('goMatrixMultiply');
    setResults(prev => ({ ...prev, matrix: result }));
  };

  const runComplexComputation = () => {
    if (!wasmReady) return;
    setLoading(true);
    setTimeout(() => {
      const result = callWasmFunction('goComplexComputation', 100000);
      setResults(prev => ({ ...prev, computation: result }));
      setLoading(false);
    }, 10);
  };

  const runCryptoHash = () => {
    if (!wasmReady) return;
    const result = callWasmFunction('goCryptoHash', 'Hello, Baraqex WASM!');
    setResults(prev => ({ ...prev, hash: result }));
  };

  return (
    <html>
      <head>
        <title>Baraqex Go WASM App</title>
        <meta name="description" content="High-performance Go WebAssembly integration with Baraqex" />
        <link rel="stylesheet" href="/wasm-styles.css" />
      </head>
      <body>
        <div className="wasm-app">
          <header className="header">
            <h1>🔄 Baraqex + Go WebAssembly</h1>
            <p>High-performance computing in the browser</p>
            <div className={`status ${wasmReady ? 'ready' : 'loading'}`}>
              WASM Status: {loading ? 'Loading...' : wasmReady ? 'Ready' : 'Not Ready'}
            </div>
          </header>

          <main className="main-content">
            <section className="demo-section">
              <h2>Go Function Demonstrations</h2>
              
              <div className="demo-grid">
                <div className="demo-card">
                  <h3>📊 Factorial Calculation</h3>
                  <button onClick={runFactorial} disabled={!wasmReady} className="demo-btn">
                    Calculate 10!
                  </button>
                  {results.factorial && (
                    <div className="result">
                      Result: <strong>{results.factorial}</strong>
                    </div>
                  )}
                </div>

                <div className="demo-card">
                  <h3>🔢 Matrix Multiplication</h3>
                  <button onClick={runMatrixMultiply} disabled={!wasmReady} className="demo-btn">
                    Multiply 2x2 Matrices
                  </button>
                  {results.matrix && (
                    <div className="result">
                      <strong>{results.matrix.computation}</strong>
                    </div>
                  )}
                </div>

                <div className="demo-card">
                  <h3>🧮 Complex Computation</h3>
                  <button onClick={runComplexComputation} disabled={!wasmReady || loading} className="demo-btn">
                    {loading ? 'Computing...' : 'Estimate π (Monte Carlo)'}
                  </button>
                  {results.computation && (
                    <div className="result">
                      <div>π ≈ <strong>{results.computation.pi?.toFixed(6)}</strong></div>
                      <div>Time: {results.computation.duration}ms</div>
                      <div>Accuracy: {results.computation.accuracy?.toFixed(6)}</div>
                    </div>
                  )}
                </div>

                <div className="demo-card">
                  <h3>🔐 Crypto Hash</h3>
                  <button onClick={runCryptoHash} disabled={!wasmReady} className="demo-btn">
                    Hash String
                  </button>
                  {results.hash && (
                    <div className="result">
                      <div>Input: <strong>{results.hash.input}</strong></div>
                      <div>Hash: <strong>{results.hash.hash}</strong></div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="info-section">
              <h3>🚀 Why Go + WebAssembly?</h3>
              <div className="benefit-grid">
                <div className="benefit">
                  <h4>⚡ Performance</h4>
                  <p>Near-native speed for computationally intensive tasks</p>
                </div>
                <div className="benefit">
                  <h4>🔒 Security</h4>
                  <p>Sandboxed execution environment</p>
                </div>
                <div className="benefit">
                  <h4>🌐 Portability</h4>
                  <p>Run the same code in browser and server</p>
                </div>
                <div className="benefit">
                  <h4>📦 Small Size</h4>
                  <p>Optimized binary size</p>
                </div>
              </div>
            </section>
          </main>

          <footer className="footer">
            <p>Built with Baraqex Framework + Go WebAssembly</p>
          </footer>
        </div>

        <script src="/wasm_exec.js"></script>
        <script src="/wasm-client.js" type="module"></script>
      </body>
    </html>
  );
}
