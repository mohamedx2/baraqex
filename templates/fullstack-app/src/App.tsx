import { jsx, useState } from 'baraqex';
import { HomePage } from './pages/Home';
import { AboutPage } from './pages/About';
import { WasmDemo } from './pages/WasmDemo';

export interface AppProps {
  route?: string;
  initialState?: any;
}

function parseRoute(pathname: string): string {
  const p = pathname || '/';
  if (p.startsWith('/wasm')) return 'wasm';
  if (p.startsWith('/about')) return 'about';
  return 'home';
}

export function App({ route, initialState }: AppProps) {
  const [current, setCurrent] = useState<string>(parseRoute(route || (typeof window !== 'undefined' ? window.location.pathname : '/')));

  const navigate = (e: any, target: string, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      return; // let the browser handle new-tab / new-window navigation
    }
    e.preventDefault();
    setCurrent(target);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', href);
    }
  };

  const navItems = [
    { key: 'home', label: 'Home', href: '/' },
    { key: 'about', label: 'About', href: '/about' },
    { key: 'wasm', label: 'WASM (Go)', href: '/wasm' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" onClick={(e: any) => navigate(e, 'home', '/')} className="text-xl font-bold hover:text-blue-100">
            Baraqex Full-Stack
          </a>
          <nav>
            <ul className="flex space-x-6">
              {navItems.map((item) => (
                <li key={item.key}>
                  <a
                    href={item.href}
                    onClick={(e: any) => navigate(e, item.key, item.href)}
                    aria-current={current === item.key ? 'page' : undefined}
                    className={
                      'hover:text-blue-200 ' +
                      (current === item.key ? 'underline font-semibold' : '')
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-8">
        {current === 'home' && <HomePage initialState={initialState} />}
        {current === 'about' && <AboutPage />}
        {current === 'wasm' && <WasmDemo />}
      </main>

      <footer className="bg-gray-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6 text-center text-gray-400">
          © {new Date().getFullYear()} Baraqex — SSR + WASM + Full-Stack in one template
        </div>
      </footer>
    </div>
  );
}

export default App;
