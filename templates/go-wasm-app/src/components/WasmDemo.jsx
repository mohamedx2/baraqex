import { jsx, useState } from 'frontend-hamroun';

export default function WasmDemo({ wasm }) {
  // Addition demo state
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(7);
  const [sum, setSum] = useState(null);
  
  // Data processing demo state
  const [processInput, setProcessInput] = useState(JSON.stringify({
    name: 'Test data',
    source: 'client',
    values: [10, 20, 30, 40, 50],
    timestamp: new Date().toISOString()
  }, null, 2));
  const [processResult, setProcessResult] = useState(null);
  
  // Error state
  const [error, setError] = useState(null);
  
  // Handle addition with Go WASM
  const handleCalculate = () => {
    try {
      setError(null);
      // Get the goAdd function from the WASM instance
      const goAdd = wasm.functions.goAdd;
      // Call the Go function and get the result
      const result = goAdd(parseInt(num1), parseInt(num2));
      setSum(result);
    } catch (err) {
      console.error('Error calling Go function:', err);
      setError(`Error: ${err.message}`);
    }
  };
  
  // Handle complex data processing with Go WASM
  const handleProcessData = () => {
    try {
      setError(null);
      // Parse the input JSON
      const inputData = JSON.parse(processInput);
      // Get the goProcessData function from the WASM instance
      const goProcessData = wasm.functions.goProcessData;
      // Call the Go function with the data
      const result = goProcessData(inputData);
      // Parse the returned JSON and format it
      setProcessResult(JSON.parse(result));
    } catch (err) {
      console.error('Error processing data with Go:', err);
      setError(`Error: ${err.message}`);
    }
  };
  
  return (
    <div className="wasm-demo">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <section className="demo-section">
        <h2>Simple Addition with Go</h2>
        <p>Call a Go WASM function to add two numbers:</p>
        <div className="input-row">
          <input 
            type="number" 
            value={num1} 
            onChange={(e) => setNum1(e.target.value)} 
          />
          <span className="operator">+</span>
          <input 
            type="number" 
            value={num2} 
            onChange={(e) => setNum2(e.target.value)} 
          />
          <button onClick={handleCalculate}>Calculate</button>
        </div>
        
        {sum !== null && (
          <div className="result">
            <h3>Result:</h3>
            <pre>{sum}</pre>
          </div>
        )}
      </section>
      
      <section className="demo-section">
        <h2>Complex Data Processing with Go</h2>
        <p>Process JSON data using a Go WASM function:</p>
        <div className="json-editor">
          <textarea 
            value={processInput} 
            onChange={(e) => setProcessInput(e.target.value)}
            rows={10}
          />
          <button onClick={handleProcessData}>Process Data</button>
        </div>
        
        {processResult && (
          <div className="result">
            <h3>Processed Result:</h3>
            <pre>{JSON.stringify(processResult, null, 2)}</pre>
          </div>
        )}
      </section>
      
      <section className="info-section">
        <h2>How It Works</h2>
        <p>This demo demonstrates the integration between Frontend Hamroun and Go WebAssembly with SSR:</p>
        <ol>
          <li>Server renders the initial HTML using the same React-like components</li>
          <li>Server can process data with Go WASM before sending the response</li>
          <li>Browser hydrates the app and loads its own WASM module</li>
          <li>The same Go code runs in both server and browser environments</li>
        </ol>
      </section>
    </div>
  );
}
