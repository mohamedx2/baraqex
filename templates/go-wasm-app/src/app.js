// Support both ESM and CommonJS importing styles
const frontendHamroun = 
  typeof require !== 'undefined' 
    ? require('frontend-hamroun') 
    : await import('frontend-hamroun');

// Destructure the imports from either ESM or CJS modules
const { 
  useState, 
  useEffect, 
  jsx, 
  Fragment, 
  loadGoWasm, 
  createTypedWasmFunction, 
  goValues 
} = frontendHamroun;

export function GoWasmDemo() {
  // Track loading state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wasm, setWasm] = useState(null);
  
  // Track calculation values
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(7);
  const [result, setResult] = useState(null);
  
  // Track JSON example
  const [jsonInput, setJsonInput] = useState('{"name": "Frontend Hamroun", "version": "1.0"}');
  const [jsonResult, setJsonResult] = useState(null);

  // Load the WASM module when component mounts
  useEffect(() => {
    async function loadWasmModule() {
      try {
        setLoading(true);
        console.log('Loading WASM module...');
        
        // Load WASM module using frontend-hamroun's loadGoWasm
        const wasmInstance = await loadGoWasm('/wasm/example.wasm', {
          debug: true, // Enable debug logging
          goWasmPath: '/wasm/wasm_exec.js' // Path to Go's wasm_exec.js
        });
        
        console.log('WASM module loaded successfully!', wasmInstance);
        setWasm(wasmInstance);
        
        // Demonstrate calling a function right away
        if (wasmInstance.functions.goAdd) {
          const sum = wasmInstance.functions.goAdd(5, 7);
          console.log('5 + 7 =', sum);
          setResult(sum);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to load WASM module:', err);
        setError(err.toString());
        setLoading(false);
      }
    }
    
    loadWasmModule();
    
    // Cleanup function
    return () => {
      console.log('Cleaning up WASM resources...');
      // Any cleanup needed for WASM resources
    };
  }, []); // Empty dependency array means this runs once on mount

  // Function to calculate using WASM
  const calculateResult = () => {
    if (!wasm || !wasm.functions.goAdd) {
      setError('WASM module not loaded or function not available');
      return;
    }
    
    try {
      // Call the WASM function
      const sum = wasm.functions.goAdd(parseInt(num1), parseInt(num2));
      setResult(sum);
      setError(null);
    } catch (err) {
      console.error('Error calling WASM function:', err);
      setError('Error calling WASM function: ' + err);
    }
  };
  
  // Function to parse JSON using WASM
  const parseJsonWithWasm = () => {
    if (!wasm || !wasm.functions.goParseJSON) {
      setError('WASM module not loaded or JSON parsing function not available');
      return;
    }
    
    try {
      // Call the WASM function
      const parsed = wasm.functions.goParseJSON(jsonInput);
      setJsonResult(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      console.error('Error parsing JSON with WASM:', err);
      setError('Error parsing JSON with WASM: ' + err);
    }
  };

  // Render the component
  return (
    <div className="wasm-demo">
      <h1>Go WebAssembly Demo</h1>
      
      {loading && <p>Loading WASM module...</p>}
      
      {error && (
        <div className="error">
          <h3>Error:</h3>
          <pre>{error}</pre>
        </div>
      )}
      
      {wasm && !loading && (
        <div className="demo-section">
          <h2>WASM Addition</h2>
          <div className="calculator">
            <input 
              type="number" 
              value={num1} 
              onChange={(e) => setNum1(e.target.value)} 
            />
            <span> + </span>
            <input 
              type="number" 
              value={num2} 
              onChange={(e) => setNum2(e.target.value)} 
            />
            <button onClick={calculateResult}>Calculate</button>
            <span className="result">Result: {result}</span>
          </div>
          
          <h2>WASM JSON Parsing</h2>
          <div className="json-parser">
            <textarea
              rows="5"
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            <button onClick={parseJsonWithWasm}>Parse JSON</button>
            {jsonResult && (
              <pre className="json-result">{jsonResult}</pre>
            )}
          </div>
          
          <h2>Available WASM Functions</h2>
          <ul>
            {wasm && Object.keys(wasm.functions).map(funcName => (
              <li key={funcName}>{funcName}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Support both CommonJS and ESM exports
export default GoWasmDemo;

// Add CommonJS compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GoWasmDemo };
}
