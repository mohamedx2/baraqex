import { jsx } from 'baraqex';

export function AboutPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">About this template</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
          <h3 className="font-semibold text-blue-800 mb-2">Frontend + SSR</h3>
          <p className="text-sm text-blue-900">
            The same <code className="bg-blue-100 px-1 rounded">App</code> component is rendered
            server-side with <code>baraqex</code> and hydrated on the client. Initial page HTML
            arrives fully formed.
          </p>
        </div>
        <div className="p-4 border border-green-100 rounded-lg bg-green-50">
          <h3 className="font-semibold text-green-800 mb-2">Backend (Express API)</h3>
          <p className="text-sm text-green-900">
            API endpoints under <code>/api/*</code> are served by an Express server bundled
            alongside the app. Refresh users from <code>/api/users</code>.
          </p>
        </div>
        <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
          <h3 className="font-semibold text-purple-800 mb-2">WebAssembly (Go)</h3>
          <p className="text-sm text-purple-900">
            Go source in <code>go/main.go</code> compiles to WASM via{' '}
            <code>npm run build:wasm</code>. Call Go functions straight from the browser.
          </p>
        </div>
        <div className="p-4 border border-amber-100 rounded-lg bg-amber-50">
          <h3 className="font-semibold text-amber-800 mb-2">Live reload (dev)</h3>
          <p className="text-sm text-amber-900">
            <code>npm run dev</code> bundles with esbuild and streams reload events over
            Socket.IO when files change.
          </p>
        </div>
      </div>
    </div>
  );
}
