import { jsx, useState } from 'baraqex';

export interface HomeState {
  users?: any[];
  posts?: any[];
  serverTime?: string;
}

export function HomePage({ initialState }: { initialState?: any }) {
  const initial: HomeState = initialState || { users: [], posts: [] };
  const [users, setUsers] = useState<any[]>(initial.users || []);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data);
      setMessage('Data refreshed from /api/users');
    } catch (e: any) {
      setMessage('Failed to load data: ' + e.message);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Baraqex
        </h1>
        <p className="text-gray-600">
          This template wires together server-side rendering (SSR), a REST API, WebAssembly
          compiled from Go, and hydration — all through the baraqex framework.
        </p>
        {initial.serverTime && (
          <p className="text-sm text-gray-500 mt-2">
            Server-rendered at: {initial.serverTime}
          </p>
        )}
      </section>

      <section className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Users (fetched via API)</h2>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
        {message && <p className="text-green-700 text-sm mb-3">{message}</p>}
        <ul className="divide-y divide-gray-200">
          {(users || []).map((user: any) => (
            <li key={user.id} className="py-2 flex items-center justify-between">
              <span className="font-medium">{user.name}</span>
              <span className="text-sm text-gray-500">{user.email}</span>
            </li>
          ))}
        </ul>
        {(users || []).length === 0 && (
          <p className="text-gray-500 text-sm">No users loaded yet. Click Refresh.</p>
        )}
      </section>
    </div>
  );
}
