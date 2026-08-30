import { jsx, useState, useEffect } from 'frontend-hamroun';
import { loadGoWasm } from 'frontend-hamroun/wasm';

export default function WasmDemo(props) {
  // State for WASM loading
  const [wasm, setWasm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for math demo
  const [num1, setNum1] = useState(5);
  const [num2, setNum2] = useState(3);
  const [operation, setOperation] = useState('add');
  const [result, setResult] = useState(null);
  
  // State for string operations
  const [inputText, setInputText] = useState('Hello WebAssembly!');
  const [processedText, setProcessedText] = useState('');
  
  // State for array processing
  const [arrayInput, setArrayInput] = useState('apple, banana, orange');
  const [arrayResult, setArrayResult] = useState('');
  
  // Load WASM module on client-side only
  useEffect(() => {
    async function loadWasmModule() {
      setLoading(true);
      try {
        const wasmModule = await loadGoWasm('/wasm/example.wasm', {
          debug: true
        });
        setWasm(wasmModule);
        setError(null);
        console.log('WASM module loaded:', wasmModule);
      } catch (err) {
        console.error('Failed to load WASM:', err);
        setError(`Error loading WASM: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    loadWasmModule();
  }, []);

  // Update result when inputs or operation change
  useEffect(() => {
    if (!wasm || !wasm.functions) return;
    
    try {
      let calculatedResult;
      switch (operation) {
        case 'add':
          calculatedResult = wasm.functions.goAdd(num1.toString(), num2.toString());
          break;
        case 'subtract':
          calculatedResult = wasm.functions.goSubtract(num1.toString(), num2.toString());
          break;
        case 'multiply':
          calculatedResult = wasm.functions.goMultiply(num1.toString(), num2.toString());
          break;
        case 'divide':
          calculatedResult = wasm.functions.goDivide(num1.toString(), num2.toString());
          break;
        default:
          calculatedResult = 'Unknown operation';
      }
      
      setResult(calculatedResult);
    } catch (err) {
      setResult(`Error: ${err.message}`);
    }
  }, [wasm, num1, num2, operation]);
  
  // Handle text processing
  const handleProcessText = () => {
    if (!wasm || !wasm.functions) return;
    
    try {
      // Process the text with the WASM module's goReverseString function
      const reversed = wasm.functions.goReverseString(inputText);
      setProcessedText(reversed);
    } catch (err) {
      setProcessedText(`Error: ${err.message}`);
    }
  };
  
  // Handle array processing
  const handleProcessArray = () => {
    if (!wasm || !wasm.functions) return;
    
    try {
      // Process the array with the WASM module's goProcessArray function
      const processed = wasm.functions.goProcessArray(arrayInput);
      setArrayResult(processed);
    } catch (err) {
      setArrayResult(`Error: ${err.message}`);
    }
  };

  // Handle factorial calculation
  const [factorialInput, setFactorialInput] = useState(5);
  const [factorialResult, setFactorialResult] = useState(null);
  
  const calculateFactorial = () => {
    if (!wasm || !wasm.functions) return;
    
    try {
      const result = wasm.functions.goCalculateFactorial(factorialInput.toString());
      setFactorialResult(result);
    } catch (err) {
      setFactorialResult(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return jsx('div', { className: 'container loading-container' }, [
      jsx('h1', {}, 'WebAssembly Demo'),
      jsx('div', { className: 'loading' }, [
        jsx('div', { className: 'spinner' }),
        jsx('p', {}, 'Loading WebAssembly module...')
      ])
    ]);
  }

  if (error) {
    return jsx('div', { className: 'container error-container' }, [
      jsx('h1', {}, 'WebAssembly Demo'),
      jsx('div', { className: 'error-box' }, [
        jsx('h3', {}, 'Error Loading WebAssembly'),
        jsx('p', {}, error),
        jsx('p', {}, 'Make sure your browser supports WebAssembly and that the WASM file is correctly built and accessible.')
      ]),
      jsx('a', { href: '/', className: 'button' }, 'Back to Home')
    ]);
  }

  return jsx('div', { className: 'container' }, [
    jsx('header', { className: 'header' }, [
      jsx('h1', {}, 'WebAssembly Integration Demo'),
      jsx('a', { href: '/', className: 'back-link' }, '← Back to Home')
    ]),
    
    jsx('main', { className: 'wasm-demo' }, [
      jsx('section', { className: 'intro-section' }, [
        jsx('h2', {}, 'Go + WebAssembly Integration'),
        jsx('p', {}, 'This page demonstrates how Frontend Hamroun integrates with WebAssembly modules compiled from Go. The following examples show different operations performed by Go code running in your browser.')
      ]),
      
      jsx('div', { className: 'demo-grid' }, [
        // Math Operations Demo
        jsx('section', { className: 'card' }, [
          jsx('h3', {}, 'Math Operations'),
          
          jsx('div', { className: 'form-grid' }, [
            jsx('div', { className: 'form-group' }, [
              jsx('label', { htmlFor: 'num1' }, 'First Number'),
              jsx('input', {
                id: 'num1',
                type: 'number',
                value: num1,
                onChange: (e) => setNum1(parseInt(e.target.value))
              })
            ]),
            
            jsx('div', { className: 'form-group' }, [
              jsx('label', { htmlFor: 'num2' }, 'Second Number'),
              jsx('input', {
                id: 'num2',
                type: 'number',
                value: num2,
                onChange: (e) => setNum2(parseInt(e.target.value))
              })
            ]),
            
            jsx('div', { className: 'form-group' }, [
              jsx('label', { htmlFor: 'operation' }, 'Operation'),
              jsx('select', {
                id: 'operation',
                value: operation,
                onChange: (e) => setOperation(e.target.value)
              }, [
                jsx('option', { value: 'add' }, 'Addition'),
                jsx('option', { value: 'subtract' }, 'Subtraction'),
                jsx('option', { value: 'multiply' }, 'Multiplication'),
                jsx('option', { value: 'divide' }, 'Division')
              ])
            ])
          ]),
          
          jsx('div', { className: 'result-box' }, [
            jsx('div', { className: 'result-label' }, 'Result:'),
            jsx('div', { className: 'result-value' }, result !== null ? result : 'Calculating...')
          ])
        ]),
        
        // String Operations Demo
        jsx('section', { className: 'card' }, [
          jsx('h3', {}, 'String Reversal'),
          
          jsx('div', { className: 'form-group' }, [
            jsx('label', { htmlFor: 'inputText' }, 'Input Text'),
            jsx('input', {
              id: 'inputText',
              type: 'text',
              value: inputText,
              onChange: (e) => setInputText(e.target.value)
            })
          ]),
          
          jsx('button', { 
            onClick: handleProcessText,
            className: 'btn primary'
          }, 'Reverse Text'),
          
          jsx('div', { className: 'result-box' }, [
            jsx('div', { className: 'result-label' }, 'Reversed Text:'),
            jsx('div', { className: 'result-value' }, processedText || 'Click button to process')
          ])
        ]),
        
        // Factorial Calculation Demo
        jsx('section', { className: 'card' }, [
          jsx('h3', {}, 'Factorial Calculation'),
          
          jsx('div', { className: 'form-group' }, [
            jsx('label', { htmlFor: 'factorialInput' }, 'Number (0-20)'),
            jsx('input', {
              id: 'factorialInput',
              type: 'number',
              min: '0',
              max: '20',
              value: factorialInput,
              onChange: (e) => setFactorialInput(parseInt(e.target.value))
            })
          ]),
          
          jsx('button', { 
            onClick: calculateFactorial,
            className: 'btn primary'
          }, 'Calculate Factorial'),
          
          jsx('div', { className: 'result-box' }, [
            jsx('div', { className: 'result-label' }, `Factorial of ${factorialInput}:`),
            jsx('div', { className: 'result-value' }, factorialResult || 'Click button to calculate')
          ])
        ]),
        
        // Array Processing Demo
        jsx('section', { className: 'card' }, [
          jsx('h3', {}, 'Array Processing'),
          
          jsx('div', { className: 'form-group' }, [
            jsx('label', { htmlFor: 'arrayInput' }, 'Comma-separated values'),
            jsx('input', {
              id: 'arrayInput',
              type: 'text',
              value: arrayInput,
              onChange: (e) => setArrayInput(e.target.value)
            })
          ]),
          
          jsx('button', { 
            onClick: handleProcessArray,
            className: 'btn primary'
          }, 'Process Array'),
          
          jsx('div', { className: 'result-box' }, [
            jsx('div', { className: 'result-label' }, 'Processed Array (uppercase):'),
            jsx('div', { className: 'result-value array-result' }, arrayResult || 'Click button to process')
          ])
        ])
      ]),
      
      jsx('section', { className: 'info-section' }, [
        jsx('h3', {}, 'How It Works'),
        jsx('p', {}, 'The computations on this page are performed by Go code compiled to WebAssembly. The WebAssembly binary is loaded by Frontend Hamroun\'s WASM utility and executed in your browser.'),
        jsx('p', {}, 'This demonstrates how you can leverage the performance and type safety of Go while maintaining the interactivity of a JavaScript application.')
      ])
    ]),
    
    jsx('footer', {}, [
      jsx('p', {}, '© 2025 Frontend Hamroun Framework - WebAssembly Demo')
    ])
  ]);
}

// Static metadata for SEO
WasmDemo.getTitle = () => 'WebAssembly Demo - Frontend Hamroun';
WasmDemo.getDescription = () => 'Interactive demonstration of WebAssembly integration with Go in the Frontend Hamroun framework.';
