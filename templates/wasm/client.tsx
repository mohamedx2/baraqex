import { jsx, render } from 'frontend-hamroun';
import { loadGoWasm } from '../wasm-loader.js';

// WASM Demo Component
function WasmDemo() {
  const [wasmReady, setWasmReady] = useState(false);
  const [result, setResult] = useState('');
  const [input1, setInput1] = useState('5');
  const [input2, setInput2] = useState('3');
  const [fibInput, setFibInput] = useState('10');

  useEffect(() => {
    loadWasm();
  }, []);

  const loadWasm = async () => {
    try {
      await loadGoWasm('/example.wasm');
      setWasmReady(true);
      setResult('✅ Go WASM module loaded successfully!');
    } catch (error) {
      setResult(`❌ Failed to load WASM: ${error.message}`);
    }
  };

  const testAdd = () => {
    if (!wasmReady) return;
    try {
      const num1 = parseFloat(input1);
      const num2 = parseFloat(input2);
      const result = (window as any).add(num1, num2);
      setResult(`Add result: ${num1} + ${num2} = ${result}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testFibonacci = () => {
    if (!wasmReady) return;
    try {
      const n = parseInt(fibInput);
      const result = (window as any).fibonacci(n);
      setResult(`Fibonacci(${n}) = ${result}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testProcessArray = () => {
    if (!wasmReady) return;
    try {
      const testArray = [1, 2, 3, 4, 5];
      const result = (window as any).processArray(testArray);
      const resultArray = Array.from(result);
      setResult(`Process array [${testArray.join(', ')}] = [${resultArray.join(', ')}]`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testFormatMessage = () => {
    if (!wasmReady) return;
    try {
      const message = 'Hello from JavaScript!';
      const result = (window as any).formatMessage(message);
      setResult(`Formatted: ${result}`);
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testPerformance = () => {
    if (!wasmReady) return;
    try {
      const iterations = 100000;
      const startTime = performance.now();
      const result = (window as any).performanceBenchmark(iterations);
      const endTime = performance.now();
      
      setResult(
        `Performance test: ${result.message}\n` +
        `Result: ${result.result}\n` +
        `Time: ${(endTime - startTime).toFixed(2)}ms`
      );
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  const testTypeDemo = () => {
    if (!wasmReady) return;
    try {
      const result = (window as any).typeDemo();
      setResult(
        `Type demo results:\n` +
        `String: ${result.string}\n` +
        `Number: ${result.number}\n` +
        `Boolean: ${result.boolean}\n` +
        `Array: [${Array.from(result.array).join(', ')}]`
      );
    } catch (error) {
      setResult(`Error: ${error.message}`);
    }
  };

  return jsx('div', {
    className: 'wasm-demo',
    children: [
      jsx('h1', { children: '🚀 Frontend Hamroun + Go WASM Demo' }),
      
      jsx('div', {
        className: 'status',
        children: jsx('p', {
          className: wasmReady ? 'ready' : 'loading',
          children: wasmReady ? '✅ WASM Ready' : '⏳ Loading WASM...'
        })
      }),

      jsx('div', {
        className: 'controls',
        children: [
          jsx('h2', { children: '🧮 Arithmetic Operations' }),
          jsx('div', {
            className: 'input-group',
            children: [
              jsx('input', {
                type: 'number',
                value: input1,
                onChange: (e: any) => setInput1(e.target.value),
                placeholder: 'First number'
              }),
              jsx('span', { children: ' + ' }),
              jsx('input', {
                type: 'number',
                value: input2,
                onChange: (e: any) => setInput2(e.target.value),
                placeholder: 'Second number'
              }),
              jsx('button', {
                onClick: testAdd,
                disabled: !wasmReady,
                children: 'Calculate'
              })
            ]
          }),

          jsx('h2', { children: '🔢 Fibonacci Sequence' }),
          jsx('div', {
            className: 'input-group',
            children: [
              jsx('input', {
                type: 'number',
                value: fibInput,
                onChange: (e: any) => setFibInput(e.target.value),
                placeholder: 'Fibonacci number'
              }),
              jsx('button', {
                onClick: testFibonacci,
                disabled: !wasmReady,
                children: 'Calculate Fibonacci'
              })
            ]
          }),

          jsx('h2', { children: '🔧 Advanced Functions' }),
          jsx('div', {
            className: 'button-group',
            children: [
              jsx('button', {
                onClick: testProcessArray,
                disabled: !wasmReady,
                children: 'Process Array'
              }),
              jsx('button', {
                onClick: testFormatMessage,
                disabled: !wasmReady,
                children: 'Format Message'
              }),
              jsx('button', {
                onClick: testPerformance,
                disabled: !wasmReady,
                children: 'Performance Test'
              }),
              jsx('button', {
                onClick: testTypeDemo,
                disabled: !wasmReady,
                children: 'Type Demo'
              })
            ]
          })
        ]
      }),

      jsx('div', {
        className: 'result',
        children: [
          jsx('h3', { children: '📋 Result:' }),
          jsx('pre', { children: result })
        ]
      })
    ]
  });
}

// App Component
function App() {
  return jsx('div', {
    className: 'app',
    children: jsx(WasmDemo, {})
  });
}

// Render the app
const appElement = document.getElementById('app');
if (appElement) {
  render(jsx(App, {}), appElement);
}

// Import statements for hooks
import { useState, useEffect } from 'frontend-hamroun';
