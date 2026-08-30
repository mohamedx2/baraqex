import { jsx } from 'frontend-hamroun';

interface LayoutProps {
  children: any;
  title?: string;
}

export default function Layout({ children, title = 'Frontend Hamroun App' }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-blue-600 text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">
            <a href="/" className="hover:text-blue-100">
              {title}
            </a>
          </h1>
          
          <nav>
            <ul className="flex space-x-6">
              <li><a href="/" className="hover:text-blue-100">Home</a></li>
              <li><a href="/about" className="hover:text-blue-100">About</a></li>
              {/* WASM demo link removed */}
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} Frontend Hamroun App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
