import { jsx, useState, useEffect, batchUpdates } from 'baraqex';
import { loadGoWasm } from 'baraqex';

export function WasmDemo() {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState('Loading Go WASM...');
  const [output, setOutput] = useState('');
  const [a, setA] = useState('5');
  const [b, setB] = useState('7');
  const [n, setN] = useState('10');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadGoWasm('/wasm/example.wasm');
        if (cancelled) return;
        batchUpdates(() => {
          setReady(true);
          setStatus('✅ Go WASM module loaded!');
          setOutput('Go functions available: goAdd, goMultiply, goFibonacci, goProcessArray');
        });
      } catch (e: any) {
        if (cancelled) return;
        setStatus('❌ Failed to load WASM: ' + e.message);
        setOutput('Run `npm run build:wasm` (requires Go) and ensure /wasm/example.wasm is served.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const call = (fn: string, ...args: any[]) => (window as any)[fn](...args);

  const add = () => setOutput(`goAdd(${a}, ${b}) = ${call('goAdd', parseFloat(a), parseFloat(b))}`);
  const multiply = () => setOutput(`goMultiply(${a}, ${b}) = ${call('goMultiply', parseFloat(a), parseFloat(b))}`);
  const fib = () => setOutput(`goFibonacci(${n}) = ${call('goFibonacci', parseInt(n, 10))}`);
  const processArr = () => {
    const result = call('goProcessArray', [1, 2, 3, 4, 5]);
    setOutput(`goProcessArray([1,2,3,4,5]) = [${Array.from(result).join(', ')}]`);
  };

  const disabled = !ready;

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Go WebAssembly Demo</h1>
      <p className={`font-medium ${ready ? 'text-green-700' : 'text-amber-600'}`}>{status}</p>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-3">Arithmetic</h3>
          <div className="flex items-center gap-2 mb-3">
            <input value={a} onChange={(e: any) => setA(e.target.value)} className="w-20 px-2 py-1 border rounded" />
            <input value={b} onChange={(e: any) => setB(e.target.value)} className="w-20 px-2 py-1 border rounded" />
          </div>
          <div className="flex gap-2">
            <button onClick={add} disabled={disabled} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40">Add</button>
            <button onClick={multiply} disabled={disabled} className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40">Multiply</button>
          </div>
        </div>
        <div className="p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-700 mb-3">Fibonacci</h3>
          <input value={n} onChange={(e: any) => setN(e.target.value)} className="w-24 px-2 py-1 border rounded mb-3" />
          <div>
            <button onClick={fib} disabled={disabled} className="px-3 py-1 bg-purple-600 text-white rounded disabled:opacity-40">Fibonacci(n)</button>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold text-gray-700 mb-3">Arrays (Int32)</h3>
        <button onClick={processArr} disabled={disabled} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-40">
          Process array
        </button>
      </div>
      {output && (
        <pre className="p-4 bg-gray-900 text-green-400 rounded-lg overflow-auto text-sm">
          {output}
        </pre>
      )}
    </div>
  );
}
